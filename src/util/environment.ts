export const Environment = import.meta.env.MODE === "development" ? "dev" : "prod";
export const isDevelopment = Environment == "dev";
export const isProduction = Environment == "prod";