import classes from "./style.module.scss";
import surrealistUrl from "~/assets/images/surrealist.webp";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button, Image, MantineProvider, Stack, Text } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { CODE_RES_KEY, STATE_RES_KEY } from "~/util/storage";
import { isDevelopment } from "~/util/environment";

type Result = "redirect" | "launch" | "error";

const REDIRECT_ENDPOINT = isDevelopment
	? "http://localhost:1420"
	: `https://${location.host}`;

export function CloudCallbackScreen() {
	const [result, setResult] = useState<Result>("redirect");
	const [error, setError] = useState<string | undefined>(undefined);
	const codeRef = useRef("");
	const stateRef = useRef("");

	const launchApp = useCallback(() => {
		const code = codeRef.current;
		const state = stateRef.current;

		location.href = `surrealist://?intent=cloud-callback:code=${code},state=${state}`;
	}, []);

	useLayoutEffect(() => {
		const params = new URLSearchParams(window.location.search);

		const code = params.get("code");
		const state = params.get("state");
		const error = params.get("error");
		const error_description = params.get("error_description");

		// An error occurred
		if (error || error_description) {
			setResult("error");
			setError(`An error occurred: ${error_description} (${error})`);
			return;
		}

		// Required parameters are missing
		if (!code || !state) {
			location.href = REDIRECT_ENDPOINT;
			return;
		}

		// Launch the desktop app
		if (state.startsWith("desktop")) {
			codeRef.current = code;
			stateRef.current = state;
			setResult("launch");
			launchApp();
			return;
		}

		// Browser authentication redirect
		if (state.startsWith("browser")) {
			sessionStorage.setItem(CODE_RES_KEY, code);
			sessionStorage.setItem(STATE_RES_KEY, state);
			location.href = REDIRECT_ENDPOINT;
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
					src={surrealistUrl}
					w={175}
				/>
				{result === "redirect" ? (
					<Text fz="lg">
						Redirecting...
					</Text>
				) : result === "error" ? (
					<>
						<Text fz="lg" c="red">
							{error ?? "Authentication could not be completed"}
						</Text>
						<Button onClick={() => { location.href = REDIRECT_ENDPOINT; }}>
							Continue to Surrealist
						</Button>
					</>
				) : (
					<>
						<Text fz="lg">
							Opening Surrealist...
						</Text>
						<Text
							className={classes.launch}
							onClick={launchApp}
						>
							If the app does not open automatically, please click here to open it
						</Text>
						<Text c="slate">
							You can close this tab once the app has opened
						</Text>
					</>
				)}
			</Stack>
		</MantineProvider>
	);
}
