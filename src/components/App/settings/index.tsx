import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Center,
	Group,
	Image,
	Modal,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useRef, useState } from "react";
import { isDesktop } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useVersionCopy } from "~/hooks/debug";
import { useKeymap } from "~/hooks/keymap";
import { useIsLight } from "~/hooks/theme";
import { useIntent } from "~/hooks/url";
import type { FeatureCondition } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import {
	iconBalance,
	iconClose,
	iconCloud,
	iconEye,
	iconFlag,
	iconPlay,
	iconServer,
	iconWrench,
} from "~/util/icons";
import { AppearanceTab } from "./tabs/Appearance";
import { BehaviourTab } from "./tabs/Behaviour";
import { CloudTab } from "./tabs/Cloud";
import { FeatureFlagsTab } from "./tabs/FeatureFlags";
import { LicensesTab } from "./tabs/Licenses";
import { ServingTab } from "./tabs/Serving";
import { TemplatesTab } from "./tabs/Templates";

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
		component: BehaviourTab,
	},
	{
		id: "appearance",
		name: "Appearance",
		icon: iconEye,
		component: AppearanceTab,
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
		disabled: () => !isDesktop,
	},
	{
		id: "cloud",
		name: "Surreal Cloud",
		icon: iconCloud,
		component: CloudTab,
	},
	{
		id: "feature-flags",
		name: "Feature Flags",
		icon: iconFlag,
		component: FeatureFlagsTab,
		disabled: (flags) => !flags.feature_flags,
	},
	{
		id: "licenses",
		name: "OSS Licenses",
		icon: iconBalance,
		component: LicensesTab,
	},
];

export function Settings() {
	const isLight = useIsLight();
	const logoUrl = useLogoUrl();
	const [flags, setFlags] = useFeatureFlags();
	const [open, openHandle] = useBoolean();
	const [copyDebug, clipboard] = useVersionCopy();
	const [activeTab, setActiveTab] = useState("behaviour");
	const tabsRef = useRef<HTMLDivElement>(null);

	const categories = CATEGORIES.map((c) => ({
		...c,
		disabled: c.disabled ? c.disabled(flags) : false,
	}));

	const activeCategory = categories.find((c) => c.id === activeTab);
	const Component = activeCategory?.component;

	useIntent("open-settings", ({ tab }) => {
		if (tab) {
			setActiveTab(tab);

			setTimeout(() => {
				tabsRef.current
					?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)
					?.focus();
			}, 250);

			if (tab === "feature-flags") {
				setFlags({ feature_flags: true });
			}
		}

		openHandle.open();
	});

	useKeymap([
		[
			"mod+,",
			() => {
				openHandle.open();
			},
		],
	]);

	return (
		<>
			<Modal
				opened={open}
				onClose={openHandle.close}
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
							<Center>
								<Image h={26} src={logoUrl} />
							</Center>
							<Text
								ta="center"
								c={clipboard.copied ? "surreal.6" : "slate"}
								size="xs"
								className={classes.version}
								onClick={copyDebug}
							>
								{clipboard.copied
									? "Copied to clipboard!"
									: `Version ${import.meta.env.VERSION}`}
							</Text>
						</Stack>
						<Stack gap="xs" ref={tabsRef}>
							{categories.map(
								({ id, name, icon, disabled }) =>
									(!disabled || id === activeTab) && (
										<Entry
											key={id}
											variant="subtle"
											isActive={activeTab === id}
											onClick={() => setActiveTab(id)}
											data-tab={id}
											leftSection={<Icon path={icon} />}
										>
											{name}
										</Entry>
									),
							)}
						</Stack>
					</Box>
					<Stack px="xl" pt="xl" gap="md" flex={1} miw={0}>
						<Group>
							<Title size={26} c="bright">
								{activeCategory?.name ?? "Unknown"}
							</Title>
							<Spacer />
							<ActionIcon
								onClick={openHandle.close}
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
								{Component && <Component />}
							</Stack>
						</ScrollArea>
					</Stack>
				</Group>
			</Modal>
		</>
	);
}
