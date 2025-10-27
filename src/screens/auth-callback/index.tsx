import { Button, List, MantineProvider, Paper, Stack, Text } from "@mantine/core";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { isDevelopment } from "~/util/environment";
import { MANTINE_THEME } from "~/util/mantine";
import { CODE_RES_KEY, STATE_RES_KEY } from "~/util/storage";
import classes from "./style.module.scss";

type Result = "redirect" | "launch" | "error" | "close" | "verify";

const REDIRECT_ENDPOINT = isDevelopment ? "http://localhost:1420" : `https://${location.host}`;

// http://localhost:1420/cloud/callback/index.html?error=access_denied&error_description=Please%20verify%20your%20email%20before%20continuing.&state=browser2NP1~m7q8.NGa_Z7RIHDTY6sZN7hUaUPqZhlGsvLKfQ4sJkniN

export function AuthCallbackScreen() {
	const [result, setResult] = useState<Result>("redirect");
	const [error, setError] = useState<string | undefined>(undefined);
	const codeRef = useRef("");
	const stateRef = useRef("");

	const launchApp = useCallback(() => {
		const code = codeRef.current;
		const state = stateRef.current;

		if (code && state) {
			location.href = `surrealist://?intent=cloud-auth:code=${code},state=${state}`;
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
		const errorDescription = params.get("error_description");

		// An error occurred, display it
		// Additionally, intercept verify results
		if (error || errorDescription) {
			const shouldVerify = errorDescription?.includes("verify your email");

			if (shouldVerify) {
				setResult("verify");
			} else {
				setResult("error");
				setError(`Encountered an error: ${errorDescription} (${error})`);
			}
			return;
		}

		// Find the target platform
		const platform =
			target === "desktop" || state?.startsWith("desktop")
				? "desktop"
				: target === "browser" || state?.startsWith("browser")
					? "browser"
					: "unknown";

		// Found desktopn, launch the desktop app
		if (platform === "desktop") {
			if (code && state) {
				codeRef.current = code;
				stateRef.current = state;
			}

			setResult("launch");
			launchApp();
			return;
		}

		// Found browser, redirect to the browser app
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

		// Unspecified callback, request user to close the page
		setResult("close");
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
				{result === "redirect" ? (
					<Text fz="lg">Redirecting...</Text>
				) : result === "close" ? (
					<Text fz="lg">You can now safely close this page and return to Surrealist</Text>
				) : result === "verify" ? (
					<Paper p="xl">
						<Stack maw={300}>
							<PrimaryTitle>Verify your email</PrimaryTitle>
							<Text>
								Please verify your email before continuing to SurrealDB Cloud. If
								you have not received an email, please check your spam folder.
							</Text>
							<List>
								<List.Item>Open your email inbox and find the email</List.Item>
								<List.Item>Press the button to verify your email</List.Item>
								<List.Item>Return to Surrealist to enter SurrealDB Cloud</List.Item>
							</List>
							<Text
								mt="md"
								c="bright"
							>
								Already verified your email?
							</Text>
							<Button
								variant="gradient"
								radius="xs"
								style={{
									backgroundOrigin: "border-box",
									border: "1px solid rgba(255, 255, 255, 0.3)",
								}}
								onClick={() => {
									location.href = `${REDIRECT_ENDPOINT}?intent=cloud-signin`;
								}}
							>
								Continue to SurrealDB Cloud
							</Button>
						</Stack>
					</Paper>
				) : result === "error" ? (
					<Text
						fz="lg"
						c="red"
					>
						{error}
					</Text>
				) : result === "launch" ? (
					<>
						<Text fz="lg">Opening Surrealist...</Text>
						<Text
							className={classes.launch}
							onClick={launchApp}
						>
							If the app does not open automatically, please click here to open it
						</Text>
						<Text c="slate">You can close this page once the app has opened</Text>
					</>
				) : null}
			</Stack>
		</MantineProvider>
	);
}
