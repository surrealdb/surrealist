import { createContext, type ReactNode, useContext, useEffect } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";

interface GoogleAnalyticsContext {

	/**
	 * Track a custom event
	 */
	trackEvent: (id: GAIdentifier, data: object) => Promise<void>;
}

interface GoogleAnalyticsProviderProps {
	children: ReactNode;
}

// The type of the event that is being tracked
export type GAIdentifier = "event" | "pageview";

const GoogleAnalyticsContext = createContext<GoogleAnalyticsContext | null>(null);

function useGoogleAnalytics() {
	const context = useContext(GoogleAnalyticsContext);

	if (!context) {
		throw new Error("useGoogleAnalytics must be used within a GoogleAnalyticsProvider");
	}

	return context;
}

// Create a promise that resolves when Google Analytics is loaded
// This is needed to ensure that the trackEvent function is only called after Google Analytics is loaded.
const initializer = Promise.withResolvers<null>();

function GoogleAnalyticsProvider(props: GoogleAnalyticsProviderProps) {

	const trackEvent = useStable(async (event: GAIdentifier, data: object) => {
		await initializer.promise;

		window.gtag(event, {
			...data,
			event: "surreal-event",
			adapter: adapter.id,
			platform: adapter.platform
		});

		console.log("Pushed GA Event: ", event, data);
	});

	// Initialize Google Analytics
	useEffect(() => {

		window.dataLayer = window.dataLayer ?? [];

		// assign global gtag function
		window.gtag = (...args: any[]) => {
			window.dataLayer.push(...args);
		};

		window.gtag('js', new Date());
		window.gtag('config', 'G-PVD8NEJ3Z2', {
			server_container_url: 'https://surrealdb.com/data',
		});

		const script = document.createElement("script");

		script.id = 'surreal-gtm';
		script.src = 'https://surrealdb.com/data/script.js'; // <---- TODO: Change this to the correct URL?
		script.async = true;

		script.addEventListener("load", async () => {
			console.info("Google Analytics loaded");
			initializer.resolve(null);
		});

		const onError = () => {
			console.error("Failed to load Google Analytics");
			initializer.reject();
		};

		script.addEventListener("error", onError);
		script.addEventListener("abort", onError);

		setTimeout(() => document.head.appendChild(script), 250);

	}, []);

	return (
		<GoogleAnalyticsContext.Provider value={{ trackEvent }}>
			{props.children}
		</GoogleAnalyticsContext.Provider>
	);
}

export { useGoogleAnalytics, GoogleAnalyticsProvider };