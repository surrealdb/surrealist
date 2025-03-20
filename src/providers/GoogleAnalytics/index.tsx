import { type ReactNode, createContext, useEffect } from "react";
import { adapter } from "~/adapter";

interface GoogleAnalyticsProviderProps {
	children: ReactNode;
}

// The type of the event that is being tracked
export type GAIdentifier = "event" | "pageview";

const GoogleAnalyticsContext = createContext(null);

// Create a promise that resolves when Google Analytics is loaded
// This is needed to ensure that the trackEvent function is only called after Google Analytics is loaded.
const initializer = Promise.withResolvers<null>();

function GoogleAnalyticsProvider(props: GoogleAnalyticsProviderProps) {
	// Initialize Google Analytics
	useEffect(() => {
		window.dataLayer = window.dataLayer ?? [];

		// assign global gtag function
		window.gtag = (...args: any[]) => {
			window.dataLayer.push(...args);
		};

		window.tagEvent = async (event: string, data?: object) => {
			await initializer.promise;
			window.gtag({
				...(data ?? {}),
				event_name: event,
				adapter: adapter.id,
				platform: adapter.platform,
			});
		};

		const host = window.location.host;
		const server_container_url = `https://${host}/data`;
		const scriptSource = `https://${host}/data/script.js`;

		window.gtag("js", new Date());
		window.gtag("config", import.meta.env.GTM_ID, { server_container_url });

		const script = document.createElement("script");

		script.id = "surreal-gtm";
		script.src = scriptSource; // <---- TODO: Change this to the correct URL?
		script.defer = true;

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
		<GoogleAnalyticsContext.Provider value={null}>
			{props.children}
		</GoogleAnalyticsContext.Provider>
	);
}

export { GoogleAnalyticsProvider };
