import logoDarkUrl from "~/assets/images/dark/logo.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import { useThemeImage } from "./theme";

export function useLogoUrl() {
	return useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});
}
