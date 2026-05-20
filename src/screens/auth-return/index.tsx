import { MantineProvider, Stack, Text, v8CssVariablesResolver } from "@mantine/core";
import { useLayoutEffect, useState } from "react";
import { useThemePreference } from "~/hooks/theme";
import { isDevelopment } from "~/util/environment";
import { SURREALIST_THEME } from "~/util/mantine";
import classes from "./style.module.scss";

const AUTH_MESSAGE_TYPE = "surrealist-auth-callback";

const REDIRECT_ENDPOINT = isDevelopment ? "http://localhost:1420" : `https://${location.host}`;

export function AuthReturnScreen() {
	const colorScheme = useThemePreference();
	const [showClose, setShowClose] = useState(false);

	useLayoutEffect(() => {
		if (window.opener) {
			window.opener.postMessage(
				{
					type: AUTH_MESSAGE_TYPE,
					url: location.href,
				},
				location.origin,
			);

			window.close();
			setShowClose(true);
			return;
		}

		const params = new URLSearchParams(window.location.search);
		const hasPayload = params.has("code") || params.has("error");

		if (hasPayload) {
			location.href = `${REDIRECT_ENDPOINT}/${window.location.search}${window.location.hash}`;
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
