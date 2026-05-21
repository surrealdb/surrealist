import { MantineProvider, Stack, Text, v8CssVariablesResolver } from "@mantine/core";
import { useLayoutEffect, useState } from "react";
import { useThemePreference } from "~/hooks/theme";
import { SURREALIST_THEME } from "~/util/mantine";
import { SURREAL_OAUTH_CALLBACK_MESSAGE } from "~/util/surreal-oauth";
import classes from "../auth-return/style.module.scss";

export function SurrealOAuthReturnScreen() {
	const colorScheme = useThemePreference();
	const [showClose, setShowClose] = useState(false);

	useLayoutEffect(() => {
		if (window.opener) {
			window.opener.postMessage(
				{
					type: SURREAL_OAUTH_CALLBACK_MESSAGE,
					url: location.href,
				},
				location.origin,
			);

			window.close();
			setShowClose(true);
			return;
		}

		setShowClose(true);
	}, []);

	return (
		<MantineProvider
			cssVariablesResolver={v8CssVariablesResolver}
			theme={SURREALIST_THEME}
			forceColorScheme={colorScheme}
		>
			<Stack
				className={classes.root}
				justify="center"
				align="center"
				gap="xl"
			>
				{showClose && (
					<Text fz="lg">You can now safely close this page and return to Surrealist</Text>
				)}
			</Stack>
		</MantineProvider>
	);
}
