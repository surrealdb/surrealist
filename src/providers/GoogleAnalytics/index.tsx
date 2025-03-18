import { createContext, type ReactNode, useContext, useEffect } from "react";

interface GoogleAnalyticsContext {

	/**
	 * Track a custom event
	 */
	trackEvent: (id: string, data: object) => void;
}

interface GoogleAnalyticsProviderProps {
	gtmId: string;
	children: ReactNode;
	platform: "surrealist" | "surrealist-mini";
}

const GoogleAnalyticsContext = createContext<GoogleAnalyticsContext | null>(null);

function useGoogleAnalytics() {
	const context = useContext(GoogleAnalyticsContext);

	if (!context) {
		throw new Error("useGoogleAnalytics must be used within a GoogleAnalyticsProvider");
	}

	return context;
}

function GoogleAnalyticsProvider(props: GoogleAnalyticsProviderProps) {

	const trackEvent = (id: string, data: object) => {

	};

	// Initialize Google Analytics
	useEffect(() => {
		const script = document.createElement("script");

		script.id = 'surreal-gtm';
		script.src = 'https://surrealdb.com/data/script.js'; // <---- TODO: Change this to the correct URL?
		script.async = true;

		script.addEventListener("load", () => {
			console.info("Google Analytics loaded");
		});

		document.head.appendChild(script);
	}, []);

	return (
		<GoogleAnalyticsContext.Provider value={{ trackEvent }}>
			{props.children}
		</GoogleAnalyticsContext.Provider>
	);
}

export { useGoogleAnalytics, GoogleAnalyticsProvider };