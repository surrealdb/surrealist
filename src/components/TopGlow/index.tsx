import { Box, rem } from "@mantine/core";
import glowUrl from "~/assets/images/glow.png";
import classes from "./style.module.scss";

export interface TopGlowProps {
	offset?: number | null;
}

export function TopGlow({ offset }: TopGlowProps) {
	if (offset === null) return null;

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
