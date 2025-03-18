import { createContext, type ReactNode, useContext, useEffect } from "react";

interface GoogleAnalyticsContext {

	/**
	 * Track a custom event
	 */
	trackEvent: (id: GAIdentifier, data: object) => Promise<void>;
}

interface GoogleAnalyticsProviderProps {
	gtmId: string;
	children: ReactNode;
	platform: "surrealist" | "surrealist-mini";
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

function GoogleAnalyticsProvider(props: GoogleAnalyticsProviderProps) {

	// Create a promise that resolves when Google Analytics is loaded
	// This is needed to ensure that the trackEvent function is only called after Google Analytics is loaded.
	const { promise, reject, resolve } = Promise.withResolvers<null>();

	const trackEvent = async (id: GAIdentifier, data: object) => {
		await promise;
		window.dataLayer.push({ event: id, eventProps: data });
		console.log("Pushed GA Event: ", id, data);
	};

	// Initialize Google Analytics
	useEffect(() => {
		const script = document.createElement("script");

		script.id = 'surreal-gtm';
		script.src = 'https://surrealdb.com/data/script.js'; // <---- TODO: Change this to the correct URL?
		script.async = true;

		script.addEventListener("load", () => {
			console.info("Google Analytics loaded");
			window.dataLayer = window.dataLayer || [];
			resolve(null);
		});

		const onError = () => {
			console.error("Failed to load Google Analytics");
			reject();
		};

		script.addEventListener("error", onError);
		script.addEventListener("abort", onError);

		document.head.appendChild(script);

	}, [resolve, reject]);

	return (
		<GoogleAnalyticsContext.Provider value={{ trackEvent }}>
			{props.children}
		</GoogleAnalyticsContext.Provider>
	);
}

export { useGoogleAnalytics, GoogleAnalyticsProvider };