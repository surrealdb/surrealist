import { type ReactNode, createContext, useEffect } from "react";
import { adapter, isBrowser, isDesktop } from "~/adapter";

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
		window.gtag = function () {
			// biome-ignore lint/complexity/useArrowFunction lint/style/noArguments: Doesn't work here
			window.dataLayer.push(arguments);
		};

		window.tagEvent = async (event: string, data?: object) => {
			await initializer.promise;
			window.gtag({
				event,
				...(data ?? {}),
				adapter: adapter.id,
				platform: adapter.platform,
			});
		};

		const host = window.location.host.includes("localhost")
			? "dev.surrealist.app"
			: window.location.host;
		const scriptSource = `https://${host}/data/script.js`;

		window.gtag("set", "linker", {
			accept_incoming: true,
			decorate_forms: true,
			url_position: "query",
			domains: ["surrealdb.com", "surrealist.app"],
		});

		window.gtag("js", new Date());

		if (isBrowser) {
			const server_container_url = `https://${host}/data`;

			window.gtag("config", import.meta.env.GTM_ID, { server_container_url });
		} else {
			window.gtag("config", import.meta.env.GTM_ID);
		}

		const script = document.createElement("script");

		script.id = "surreal-gtm";
		script.src = scriptSource; // <---- TODO: Change this to the correct URL?
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

		document.head.appendChild(script);

		if (isBrowser && "serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js");
			navigator.serviceWorker.addEventListener("controllerchange", () => {
				window.location.reload();
			});
		}
	}, []);

	return (
		<GoogleAnalyticsContext.Provider value={null}>
			{props.children}
		</GoogleAnalyticsContext.Provider>
	);
}

export { GoogleAnalyticsProvider };
