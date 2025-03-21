import { type ReactNode, createContext, useEffect } from "react";
import { adapter, isBrowser, isDesktop } from "~/adapter";
import { isPreview, isProduction } from "~/util/environment";

interface GoogleAnalyticsProviderProps {
	children: ReactNode;
}

// The type of the event that is being tracked
export type GAIdentifier = "event" | "pageview";

const GoogleAnalyticsContext = createContext(null);

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
			window.gtag("event", event, {
				...(data ?? {}),
				adapter: adapter.id,
				platform: adapter.platform,
			});
		};

		const host = isProduction
			? "surrealist.app"
			: isPreview
				? "beta.surrealist.app"
				: "dev.surrealist.app";
		const server_container_url = `https://${host}/data`;

		window.gtag("set", "linker", {
			accept_incoming: true,
			decorate_forms: true,
			url_position: "query",
			domains: ["surrealdb.com", "surrealist.app"],
		});

		window.gtag("js", new Date());
		window.gtag("config", import.meta.env.GTM_ID, { server_container_url });

		const script = document.createElement("script");

		script.id = "surreal-gtm";
		script.src = "https://surrealist.app/data/script.js";
		script.async = true;

		script.addEventListener("load", async () => {
			console.debug(`GTM initialized with ${server_container_url}`);
		});

		const onError = () => {
			console.error("Failed to load Google Analytics");
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
