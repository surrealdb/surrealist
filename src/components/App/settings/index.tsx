import classes from "./style.module.scss";

import {
	type BoxProps,
	Center,
	Drawer,
	Group,
	Image,
	Modal,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";

import {
	iconBalance,
	iconChevronRight,
	iconClose,
	iconCommand,
	iconDownload,
	iconFlag,
	iconHelp,
	iconPlay,
	iconServer,
	iconTransfer,
	iconTune,
} from "~/util/icons";

import { useState } from "react";
import { isDesktop } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdater } from "~/hooks/updater";
import { useInterfaceStore } from "~/stores/interface";
import type { Assign, FeatureCondition } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { AboutTab } from "./tabs/About";
import { FeatureFlagsTab } from "./tabs/FeatureFlags";
import { KeybindingsTab } from "./tabs/Keybindings";
import { LicensesTab } from "./tabs/Licenses";
import { ManageDataTab } from "./tabs/ManageData";
import { PreferencesTab } from "./tabs/Preferences";
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
		id: "preferences",
		name: "Preferences",
		icon: iconTune,
		component: PreferencesTab,
	},
	{
		id: "keybindings",
		name: "Keybindings",
		icon: iconCommand,
		component: KeybindingsTab,
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
		id: "manage-data",
		name: "Backup & Restore",
		icon: iconTransfer,
		component: ManageDataTab,
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
	{
		id: "about",
		name: "About",
		icon: iconHelp,
		component: AboutTab,
	},
];

type OptionalCategory = Assign<Category, { disabled?: boolean }>;

interface SettingsSidebarProps extends BoxProps {
	activeTab: string;
	categories: OptionalCategory[];
	withBorder?: boolean;
	setActiveTab: (tab: string) => void;
}

function SettingsSidebar({
	activeTab,
	categories,
	withBorder,
	setActiveTab,
	...other
}: SettingsSidebarProps) {
	const logoUrl = useLogoUrl();

	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const { phase, progress, version, startUpdate } = useDesktopUpdater();

	const sidebarCategories = categories.filter((c) => !c.disabled || c.id === activeTab);

	return (
		<Stack
			py="lg"
			px="xl"
			h="100%"
			w={250}
			style={{
				borderRight: withBorder ? "1px solid var(--surrealist-divider-color)" : undefined,
			}}
			gap={0}
			{...other}
		>
			<Center
				mb="xl"
				py={4}
			>
				<Image
					h={36}
					src={logoUrl}
				/>
			</Center>
			<Stack
				gap="xs"
				flex={1}
			>
				{sidebarCategories.map(({ id, name, icon }) => (
					<Entry
						key={id}
						variant="subtle"
						isActive={activeTab === id}
						onClick={() => setActiveTab(id)}
						leftSection={<Icon path={icon} />}
					>
						{name}
					</Entry>
				))}

				{availableUpdate && (
					<>
						<Spacer />
						<Entry
							onClick={startUpdate}
							className={classes.updateButton}
							variant="light"
							color="slate"
							leftSection={
								<ThemeIcon
									variant="gradient"
									radius="xs"
									className={classes.updateIcon}
								>
									<Icon
										path={iconDownload}
										c="bright"
									/>
								</ThemeIcon>
							}
						>
							<Text fw={600}>New version available</Text>
							{phase === "downloading" ? (
								<Text
									c="gray.5"
									fz="sm"
								>
									Installing... ({progress}%)
								</Text>
							) : phase === "error" ? (
								<Text
									c="red"
									fz="sm"
								>
									Failed to install update
								</Text>
							) : (
								<Text
									c="gray.5"
									fz="sm"
								>
									Click to install version {version}
								</Text>
							)}
						</Entry>
					</>
				)}
			</Stack>
		</Stack>
	);
}

export function Settings() {
	const [flags, setFlags] = useFeatureFlags();
	const [open, openHandle] = useBoolean();
	const [activeTab, setActiveTab] = useState("preferences");

	const categories: OptionalCategory[] = CATEGORIES.map((c) => ({
		...c,
		disabled: c.disabled ? c.disabled(flags) : false,
	}));

	const activeCategory = categories.find((c) => c.id === activeTab);
	const Component = activeCategory?.component;

	const updateActiveTab = useStable((tab: string) => {
		overlaySidebarHandle.close();
		setActiveTab(tab);
	});

	useIntent("open-settings", ({ tab, section }) => {
		if (tab) {
			setActiveTab(tab);

			// setTimeout(() => {
			// 	tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus();
			// }, 250);

			if (tab === "feature-flags") {
				setFlags({ feature_flags: true });
			}
		}

		openHandle.open();

		setTimeout(() => {
			if (section) {
				const element = document.getElementById(section);

				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}
		}, 250);
	});

	// useKeymap([
	// 	[
	// 		"mod+,",
	// 		() => {
	// 			openHandle.open();
	// 		},
	// 	],
	// ]);

	const [overlaySidebar, overlaySidebarHandle] = useBoolean();

	return (
		<>
			<Modal
				opened={open}
				onClose={openHandle.close}
				padding={0}
				size={1200}
			>
				<Group
					h="calc(100vh - 100px)"
					mah={800}
					gap="xs"
					align="stretch"
					wrap="nowrap"
					pos="relative"
					id="settings"
				>
					<SettingsSidebar
						activeTab={activeTab}
						categories={categories}
						setActiveTab={updateActiveTab}
						withBorder
						visibleFrom="md"
					/>
					<Drawer
						hiddenFrom="md"
						opened={overlaySidebar}
						onClose={overlaySidebarHandle.close}
						portalProps={{ target: "#settings" }}
						overlayProps={{ backgroundOpacity: 0.35 }}
						padding={0}
						size={250}
					>
						<SettingsSidebar
							activeTab={activeTab}
							categories={categories}
							setActiveTab={updateActiveTab}
							w="100%"
							h="100%"
						/>
					</Drawer>
					<Stack
						pl="xl"
						pt="xl"
						gap={0}
						flex={1}
						miw={0}
					>
						<Group mb={26}>
							<ActionButton
								hiddenFrom="md"
								label="Toggle sidebar"
								onClick={overlaySidebarHandle.toggle}
							>
								<Icon path={iconChevronRight} />
							</ActionButton>
							<Title
								size={26}
								c="bright"
							>
								{activeCategory?.name ?? "Unknown"}
							</Title>
							<Spacer />
							<ActionButton
								mr="xl"
								label="Close settings"
								onClick={openHandle.close}
							>
								<Icon path={iconClose} />
							</ActionButton>
						</Group>
						{Component && <Component />}
					</Stack>
				</Group>
			</Modal>
		</>
	);
}
