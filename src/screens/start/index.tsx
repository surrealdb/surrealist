import classes from "./style.module.scss";
import startGlow from "~/assets/images/start-glow.webp";
import connection from "~/assets/images/start/connection.webp";
import sandbox from "~/assets/images/start/sandbox.webp";
import cloud from "~/assets/images/start/cloud.webp";
import { Box, Center, Group, Stack, UnstyledButton } from "@mantine/core";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { SANDBOX } from "~/constants";
import { adapter } from "~/adapter";
import { themeColor } from "~/util/mantine";
import clsx from "clsx";

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

	return (
		<Box
			pos="absolute"
			inset={0}
			className={classes.start}
			style={{
				backgroundColor: themeColor("slate.9")
			}}
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
							<Box style={{ backgroundImage: `url(${connection})` }} />
						</UnstyledButton>
						<UnstyledButton
							className={classes.startBox}
							w={320}
							h={226}
							onClick={openSandbox}
						>
							<Box style={{ backgroundImage: `url(${sandbox})` }} />
						</UnstyledButton>
					</Stack>
					<Box>
						<UnstyledButton
							className={clsx(classes.startBox, classes.cloudBox)}
							w={657}
							h={464}
							onClick={openCloud}
						>
							<Box style={{ backgroundImage: `url(${cloud})` }} />
						</UnstyledButton>
					</Box>
				</Group>
			</Center>
		</Box>
	);
}
