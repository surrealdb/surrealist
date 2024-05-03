export const environment = import.meta.env.MODE;
export const isDevelopment = environment == "development";
export const isPreview = environment == "preview";
export const isProduction = environment == "production";
