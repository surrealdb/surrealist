export const environment = import.meta.env.VITE_SURREALIST_PREVIEW
	? "preview"
	: import.meta.env.MODE === "development"
		? "dev"
		: "prod";

export const isDevelopment = environment == "dev";
export const isPreview = environment == "preview";
export const isProduction = environment == "prod";
