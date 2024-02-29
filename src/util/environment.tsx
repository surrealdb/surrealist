export const Environment = import.meta.env.VITE_SURREALIST_PREVIEW
	? "preview"
	: import.meta.env.MODE === "development"
		? "dev"
		: "prod";

export const isDevelopment = Environment == "dev";
export const isPreview = Environment == "preview";
export const isProduction = Environment == "prod";
