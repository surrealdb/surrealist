import classes from "./style.module.scss";

import { Button, Image, MantineProvider, Stack, Text } from "@mantine/core";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLogoUrl } from "~/hooks/brand";
import { isDevelopment } from "~/util/environment";
import { MANTINE_THEME } from "~/util/mantine";
import { CODE_RES_KEY, STATE_RES_KEY } from "~/util/storage";

type Result = "redirect" | "launch" | "error";

const REDIRECT_ENDPOINT = isDevelopment ? "http://localhost:1420" : `https://${location.host}`;

export function CloudCallbackScreen() {
	const [result, setResult] = useState<Result>("redirect");
	const [error, setError] = useState<string | undefined>(undefined);
	const logoUrl = useLogoUrl();
	const codeRef = useRef("");
	const stateRef = useRef("");

	const launchApp = useCallback(() => {
		const code = codeRef.current;
		const state = stateRef.current;

		if (code && state) {
			location.href = `surrealist://?intent=cloud-signin:code=${code},state=${state}`;
		} else {
			location.href = `surrealist://?intent=cloud-signout`;
		}
	}, []);

	useLayoutEffect(() => {
		const params = new URLSearchParams(window.location.search);

		const code = params.get("code");
		const state = params.get("state");
		const error = params.get("error");
		const target = params.get("target");
		const error_description = params.get("error_description");

		// An error occurred
		if (error || error_description) {
			setResult("error");
			setError(`An error occurred: ${error_description} (${error})`);
			return;
		}

		// Find the target platform
		const platform =
			target === "desktop" || state?.startsWith("desktop")
				? "desktop"
				: target === "browser" || state?.startsWith("browser")
					? "browser"
					: "unknown";

		// Launch the desktop app
		if (platform === "desktop") {
			if (code && state) {
				codeRef.current = code;
				stateRef.current = state;
			}

			setResult("launch");
			launchApp();
			return;
		}

		// Browser authentication redirect
		if (platform === "browser") {
			if (code && state) {
				sessionStorage.setItem(CODE_RES_KEY, code);
				sessionStorage.setItem(STATE_RES_KEY, state);
				location.href = REDIRECT_ENDPOINT;
				return;
			}

			location.href = `${REDIRECT_ENDPOINT}?intent=cloud-signout`;
			
			return;
		}

		// Invalid
		setResult("error");
	}, [launchApp]);

	return (
		<MantineProvider
			withCssVariables
			theme={MANTINE_THEME}
			forceColorScheme="dark"
		>
			<Stack
				className={classes.root}
				justify="center"
				align="center"
				gap="xl"
			>
				<Image
					src={logoUrl}
					w={175}
				/>
				{result === "redirect" ? (
					<Text fz="lg">Redirecting...</Text>
				) : result === "error" ? (
					<>
						<Text
							fz="lg"
							c="red"
						>
							{error ?? "Authentication could not be completed"}
						</Text>
						<Button
							onClick={() => {
								location.href = REDIRECT_ENDPOINT;
							}}
						>
							Continue to Surrealist
						</Button>
					</>
				) : (
					<>
						<Text fz="lg">Opening Surrealist...</Text>
						<Text
							className={classes.launch}
							onClick={launchApp}
						>
							If the app does not open automatically, please click here to open it
						</Text>
						<Text c="slate">You can close this tab once the app has opened</Text>
					</>
				)}
			</Stack>
		</MantineProvider>
	);
}
