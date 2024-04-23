export const environment = import.meta.env.VITE_SURREALIST_PREVIEW
	? "preview"
	: import.meta.env.MODE === "development"
		? "development"
		: "production";

export const isDevelopment = environment == "development";
export const isPreview = environment == "preview";
export const isProduction = environment == "production";
