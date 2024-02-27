import classes from "./style.module.scss";
import { iconClose, iconEye, iconPlay, iconServer, iconWrench } from "~/util/icons";
import { ActionIcon, Box, Center, Group, Modal, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { BehaviourTab } from "./tabs/Behaviour";
import { ServingTab } from "./tabs/Serving";
import { AppearanceTab } from "./tabs/Appearance";
import { TemplatesTab } from "./tabs/Templates";
import { useIsLight } from "~/hooks/theme";
import { SurrealistLogo } from "../SurrealistLogo";
import { Entry } from "../Entry";
import { useEffect, useState } from "react";
import { Spacer } from "../Spacer";
import { Icon } from "../Icon";
import { useClipboard } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { adapter, isDesktop } from "~/adapter";
import { FeatureFlagMap, useFeatureFlags } from "~/util/feature-flags";
import { FeatureFlagsTab } from "./tabs/devtools/FeatureFlags";
import { mdiFlagOutline } from "@mdi/js";

interface Category {
	id: string;
	name: string;
	icon: string;
	component: () => JSX.Element;
	disabled?: (flags: FeatureFlagMap) => boolean;
}

const VERSION = import.meta.env.VERSION;

const CATEGORIES: Category[] = [
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
		component: TemplatesTab,
		disabled: (flags) => !flags.templates
	},
	{
		id: "serving",
		name: "Database Serving",
		icon: iconPlay,
		component: ServingTab,
		disabled: () => !isDesktop
	},
	{
		id: "feature-flags",
		name: "Feature Flags",
		icon: mdiFlagOutline,
		component: FeatureFlagsTab,
		disabled: (flags) => !flags.devTools
	}
];

export interface SettingsProps {
	opened: boolean;
	onClose: () => void;
}

export function Settings(props: SettingsProps) {
	const [flags, setFlags] = useFeatureFlags();
	const isLight = useIsLight();
	const clipboard = useClipboard({ timeout: 1000 });
	const [activeTab, setActiveTab] = useState("behaviour");
	const [logoClicked, setLogoClicked] = useState<Date[]>([]);

	const categories = CATEGORIES.map((c) => ({
		...c,
		disabled: c.disabled ? c.disabled(flags) : false
	}));
	
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

	useEffect(() => {
		const now = new Date();
		const valid = logoClicked.filter((d) => d.getTime() > (now.getTime() - 2000));
		
		if (valid.length >= 5) {
			setFlags({ devTools: true });
			setLogoClicked([]);
		}
	}, [logoClicked]);

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
							<Center onClick={() => setLogoClicked([...logoClicked, new Date()].slice(0, 5))}>
								<SurrealistLogo
									h={26}
									c="bright"
								/>
							</Center>
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
							{categories.map(({ id, name, icon, disabled }) => !disabled && (
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
