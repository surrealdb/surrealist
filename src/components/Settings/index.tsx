import classes from "./style.module.scss";
import { iconClose, iconEye, iconPlay, iconServer, iconWrench } from "~/util/icons";
import { ActionIcon, Box, Group, Modal, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { BehaviourTab } from "./tabs/Behaviour";
import { ServingTab } from "./tabs/Serving";
import { AppearanceTab } from "./tabs/Appearance";
import { TemplatesTab } from "./tabs/Templates";
import { useIsLight } from "~/hooks/theme";
import { SurrealistLogo } from "../SurrealistLogo";
import { Entry } from "../Entry";
import { useState } from "react";
import { Spacer } from "../Spacer";
import { Icon } from "../Icon";
import { useClipboard } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { adapter, isDesktop } from "~/adapter";

const VERSION = import.meta.env.VERSION;

const CATEGORIES = [
	{
		id: "behaviour",
		name: "Behavior",
		icon: iconWrench,
		component: BehaviourTab
	},
	{
		id : "appearance",
		name: "Appearance",
		icon: iconEye,
		component: AppearanceTab
	},
	{
		id: "templates",
		name: "Templates",
		icon: iconServer,
		component: TemplatesTab
	},
	{
		id: "serving",
		name: "Database Serving",
		icon: iconPlay,
		component: ServingTab,
		disabled: !isDesktop
	}
];

export interface SettingsProps {
	opened: boolean;
	onClose: () => void;
}

export function Settings(props: SettingsProps) {
	const isLight = useIsLight();
	const clipboard = useClipboard({ timeout: 1000 });
	const [activeTab, setActiveTab] = useState("behaviour");

	const categories = CATEGORIES.filter((c) => !c.disabled);
	const activeCategory = categories.find((c) => c.id === activeTab)!;
	const Component = activeCategory.component;

	const copyDebug = useStable(async () => {
		const debugDump = await adapter.dumpDebug();
		const debugData = {
			...debugDump,
			version: VERSION
		};

		const debugText = Object.entries(debugData).reduce((acc, [key, value]) => {
			return `${acc}${key}: ${value}\n`;
		}, "");

		clipboard.copy(debugText);
	});

	return (
		<>
			<Modal
				opened={props.opened}
				onClose={props.onClose}
				padding={0}
				size={800}
			>
				<Group
					h={500}
					gap="xs"
					align="stretch"
					wrap="nowrap"
				>
					<Box
						p="md"
						w={250}
						bg={isLight ? "slate.0" : "slate.9"}
					>
						<Stack pt="sm" pb="xl" gap="xs">
							<SurrealistLogo
								h={26}
								c="bright"
							/>
							<Text
								ta="center"
								c={clipboard.copied ? "surreal.6" : "slate"}
								size="xs"
								style={{ cursor: 'pointer' }}
								onClick={copyDebug}
							>
								{clipboard.copied ? "Copied to clipboard!" : `Version ${VERSION}`}
							</Text>
						</Stack>
						<Stack gap="xs">
							{categories.map(({ id, name, icon }) => (
								<Entry
									key={id}
									variant="subtle"
									isActive={activeTab === id}
									onClick={() => setActiveTab(id)}
									leftSection={
										<Icon path={icon} />
									}
								>
									{name}
								</Entry>
							))}
						</Stack>
					</Box>
					<Stack
						px="xl"
						pt="xl"
						gap="md"
						flex={1}
					>
						<Group>
							<Title size={26}>
								{activeCategory.name}
							</Title>
							<Spacer />
							<ActionIcon
								onClick={props.onClose}
								size="lg"
							>
								<Icon path={iconClose} />
							</ActionIcon>
						</Group>
						<ScrollArea flex={1} scrollbars="y">
							<Stack
								gap="xl"
								className={classes.settingsList}
								pt="md"
								pb="xl"
							>
								<Component />
							</Stack>
						</ScrollArea>
					</Stack>
				</Group>
			</Modal>
		</>
	);
}
