import { Box, rem } from "@mantine/core";
import classes from "./style.module.scss";
import glowUrl from "~/assets/images/gradient-glow.webp";

export interface TopGlowProps {
	offset?: number;
}

export function TopGlow({ offset }: TopGlowProps) {
	return (
		<Box
			className={classes.glow}
			style={{
				backgroundImage: `url(${glowUrl})`,
			}}
			__vars={{
				"--offset": rem(offset ? -offset : 0),
			}}
		/>
	);
}
