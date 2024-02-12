import surrealistWhite from "~/assets/surrealist-white.svg";
import surrealistBlack from "~/assets/surrealist-black.svg";

import { useIsLight } from "~/hooks/theme";
import { Image, ImageProps } from "@mantine/core";

export function TextLogo(props: ImageProps) {
	const isLight = useIsLight();

	return isLight ? (
		<Image src={surrealistBlack} alt="Surrealist" {...props} />
	) : (
		<Image src={surrealistWhite} alt="Surrealist" {...props} />
	);
}