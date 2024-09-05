import classes from "./style.module.scss";
import iconUrl from "~/assets/images/icon.webp";
import glowUrl from "~/assets/images/start-glow.webp";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import { Box, Image, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { SANDBOX } from "~/constants";
import { adapter } from "~/adapter";
import { dispatchIntent } from "~/hooks/url";
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { iconCloud, iconCog, iconPlus, iconServer, iconSurreal } from "~/util/icons";

interface StartScreenProps {
	title: string;
	subtitle: string;
	icon: string;
	onClick: () => void;
}

function StartAction({
	title,
	subtitle,
	icon,
	onClick,
}: StartScreenProps) {
	const isLight = useIsLight();

	return (
		<Entry
			leftSection={
				<ThemeIcon
					variant="gradient"
					radius="sm"
					style={{
						backgroundOrigin: 'border-box',
						border: "1px solid rgba(255, 255, 255, 0.3)",
						boxShadow: "0 5px 20px -4px rgba(186, 0, 171, 0.6)"
					}}
				>
					<Icon path={icon} size={0.95} />
				</ThemeIcon>
			}
			onClick={onClick}
			size="md"
			h={44}
			style={{
				overflow: "unset"
			}}
		>
			<Stack gap={3} align="start" ml="sm">
				{title}
				<Text
					fz="xs"
					c={isLight ? "slate.6" : "slate.3"}
				>
					{subtitle}
				</Text>
			</Stack>
		</Entry>
	);
}

export function StartScreen() {
	const { setActiveConnection, setActiveScreen, setActiveView } =
		useConfigStore.getState();

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
	});

	const openConnectionCreator = useStable(() => {
		dispatchIntent("new-connection");
	});

	const openCloud = useStable(() => {
		setActiveScreen("database");
		setActiveView("cloud");
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl
	});

	return (
		<Box pos="absolute" inset={0} className={classes.start}>
			{!adapter.hasTitlebar && (
				<Box data-tauri-drag-region className={classes.titlebar} />
			)}

			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${glowUrl})`
				}}
			/>

			<Stack
				h="100%"
				justify="center"
				align="center"
			>
				<Image
					src={iconUrl}
					w={85}
				/>

				<Box>
					<Image
						src={logoUrl}
						w={225}
						mt="xs"
					/>

					<Text
						opacity={0.4}
						c="bright"
						ta="center"
						mt={6}
					>
						Version {import.meta.env.VERSION}
					</Text>
				</Box>

				<Paper
					p="md"
					mt={35}
					w={300}
					style={{
						border: '1px solid rgba(255, 255, 255, 0.1)'
					}}
				>
					<Stack gap="lg">
						<StartAction
							title="Create connection"
							subtitle="Connect to a remote or local database"
							icon={iconPlus}
							onClick={openConnectionCreator}
						/>
						<StartAction
							title="Open the Sandbox"
							subtitle="Explore SurrealDB right inside Surrealist"
							icon={iconSurreal}
							onClick={openSandbox}
						/>
						<StartAction
							title="Surreal Cloud"
							subtitle="Manage your databases in the cloud"
							icon={iconCloud}
							onClick={openCloud}
						/>
						<StartAction
							title="List connections"
							subtitle="Manage your existing connections"
							icon={iconServer}
							onClick={() => dispatchIntent("open-connections")}
						/>
						<StartAction
							title="Settings"
							subtitle="Configure Surrealist to your liking"
							icon={iconCog}
							onClick={() => dispatchIntent("open-settings")}
						/>
					</Stack>
				</Paper>
			</Stack>
		</Box>
	);
}
