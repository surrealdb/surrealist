import classes from "./style.module.scss";
import { iconBalance, iconClose, iconEye, iconFlag, iconPlay, iconServer, iconWrench } from "~/util/icons";
import { ActionIcon, Box, Center, Group, Modal, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { BehaviourTab } from "./tabs/Behaviour";
import { ServingTab } from "./tabs/Serving";
import { AppearanceTab } from "./tabs/Appearance";
import { TemplatesTab } from "./tabs/Templates";
import { useIsLight } from "~/hooks/theme";
import { SurrealistLogo } from "../../SurrealistLogo";
import { Entry } from "../../Entry";
import { useEffect, useRef, useState } from "react";
import { Spacer } from "../../Spacer";
import { Icon } from "../../Icon";
import { isDesktop } from "~/adapter";
import { useFeatureFlags } from "~/util/feature-flags";
import { FeatureFlagsTab } from "./tabs/FeatureFlags";
import { LicensesTab } from "./tabs/Licenses";
import { FeatureCondition } from "~/types";
import { useIntent } from "~/hooks/url";
import { useVersionCopy } from "~/hooks/debug";

interface Category {
	id: string;
	name: string;
	icon: string;
	component: () => JSX.Element;
	disabled?: FeatureCondition;
}

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
		icon: iconFlag,
		component: FeatureFlagsTab,
		disabled: (flags) => !flags.featureFlags
	},
	{
		id: "licenses",
		name: "OSS Licenses",
		icon: iconBalance,
		component: LicensesTab,
	}
];

export interface SettingsProps {
	opened: boolean;
	onClose: () => void;
	onOpen: () => void;
}

export function Settings({
	opened,
	onClose,
	onOpen
}: SettingsProps) {
	const isLight = useIsLight();
	const [flags, setFlags] = useFeatureFlags();
	const [copyDebug, clipboard] = useVersionCopy();
	const [activeTab, setActiveTab] = useState("behaviour");
	const [logoClicked, setLogoClicked] = useState<Date[]>([]);
	const tabsRef = useRef<HTMLDivElement>(null);

	const categories = CATEGORIES.map((c) => ({
		...c,
		disabled: c.disabled ? c.disabled(flags) : false
	}));

	const activeCategory = categories.find((c) => c.id === activeTab)!;
	const Component = activeCategory.component;

	useEffect(() => {
		const now = new Date();
		const valid = logoClicked.filter((d) => d.getTime() > (now.getTime() - 2000));

		if (valid.length >= 5) {
			setFlags({ featureFlags: true });
			setLogoClicked([]);
		}
	}, [logoClicked]);

	useIntent("open-settings", ({ tab }) => {
		if (tab) {
			setActiveTab(tab);

			setTimeout(() => {
				tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus();
			}, 250);
		}

		onOpen();
	});

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				padding={0}
				size={960}
			>
				<Group
					h="55vh"
					mih={500}
					gap="xs"
					align="stretch"
					wrap="nowrap"
				>
					<Box
						pt="lg"
						px="xl"
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
								{clipboard.copied ? "Copied to clipboard!" : `Version ${import.meta.env.VERSION}`}
							</Text>
						</Stack>
						<Stack gap="xs" ref={tabsRef}>
							{categories.map(({ id, name, icon, disabled }) => (!disabled || id == activeTab) && (
								<Entry
									key={id}
									variant="subtle"
									isActive={activeTab === id}
									onClick={() => setActiveTab(id)}
									data-tab={id}
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
						miw={0}
					>
						<Group>
							<Title size={26} c="bright">
								{activeCategory.name}
							</Title>
							<Spacer />
							<ActionIcon
								onClick={onClose}
								size="lg"
								aria-label="Close settings"
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
