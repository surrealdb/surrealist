import glowUrl from "~/assets/images/gradient-glow.webp";
import glowUrl2 from "~/assets/images/glow.png";

function preloadImage(url: string) {
	const img = new Image();
	img.src = url;
}

export function preloadImages() {
	preloadImage(glowUrl);
	preloadImage(glowUrl2);
}
