import clsx from "clsx";
import classes from "./style.module.scss";
import startGlow from "~/assets/images/start-glow.webp";
import connectionDarkUrl from "~/assets/images/dark/start-connection.webp";
import connectionLightUrl from "~/assets/images/light/start-connection.webp";
import sandboxDarkUrl from "~/assets/images/dark/start-sandbox.webp";
import sandboxLightUrl from "~/assets/images/light/start-sandbox.webp";
import cloudDarkUrl from "~/assets/images/dark/start-cloud.webp";
import cloudLightUrl from "~/assets/images/light/start-cloud.webp";
import { Box, Center, Group, Stack, UnstyledButton } from "@mantine/core";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { SANDBOX } from "~/constants";
import { adapter } from "~/adapter";
import { useThemeImage } from "~/hooks/theme";

export function StartScreen() {
	const { setActiveConnection, setActiveScreen, setActiveView } = useConfigStore.getState();
	const { openConnectionCreator } = useInterfaceStore.getState();

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
	});

	const openCloud = useStable(() => {
		setActiveScreen("database");
		setActiveView("cloud");
	});

	const connectionUrl = useThemeImage({
		light: connectionLightUrl,
		dark: connectionDarkUrl
	});

	const sandboxUrl = useThemeImage({
		light: sandboxLightUrl,
		dark: sandboxDarkUrl
	});

	const cloudUrl = useThemeImage({
		light: cloudLightUrl,
		dark: cloudDarkUrl
	});

	return (
		<Box
			pos="absolute"
			inset={0}
			className={classes.start}
		>
			{!adapter.hasTitlebar && (
				<Box
					data-tauri-drag-region
					className={classes.titlebar}
				/>
			)}

			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${startGlow})`
				}}
			/>

			<Center h="100%">
				<Group align="stretch" wrap="nowrap">
					<Stack>
						<UnstyledButton
							className={classes.startBox}
							w={320}
							h={226}
							onClick={openConnectionCreator}
						>
							<Box style={{ backgroundImage: `url(${connectionUrl})` }} />
						</UnstyledButton>
						<UnstyledButton
							className={classes.startBox}
							w={320}
							h={226}
							onClick={openSandbox}
						>
							<Box style={{ backgroundImage: `url(${sandboxUrl})` }} />
						</UnstyledButton>
					</Stack>
					<Box>
						<UnstyledButton
							className={clsx(classes.startBox, classes.cloudBox)}
							w={657}
							h={464}
							onClick={openCloud}
						>
							<Box style={{ backgroundImage: `url(${cloudUrl})` }} />
						</UnstyledButton>
					</Box>
				</Group>
			</Center>
		</Box>
	);
}
