import { useThemeImage } from "./theme";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

export function useLogoUrl() {
	return useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});
}
