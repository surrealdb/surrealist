import { MantineProvider, Stack, Text } from "@mantine/core";
import { useLayoutEffect } from "react";
import { useThemePreference } from "~/hooks/theme";
import { SURREALIST_THEME } from "~/util/mantine";
import classes from "./style.module.scss";

export function AuthLaunchScreen() {
	const colorScheme = useThemePreference();

	useLayoutEffect(() => {
		const params = new URLSearchParams(window.location.search);
		location.href = `surrealist://callback/auth?${params.toString()}`;
	}, []);

	return (
		<MantineProvider
			withCssVariables
			theme={SURREALIST_THEME}
			forceColorScheme={colorScheme}
		>
			<Stack
				className={classes.root}
				justify="center"
				align="center"
				gap="xl"
			>
				<Text fz="lg">Opening Surrealist...</Text>
				<Text c="obsidian">You can close this page once the app has opened</Text>
			</Stack>
		</MantineProvider>
	);
}
