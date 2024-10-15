import classes from "./style.module.scss";

import {
	ActionIcon,
	type BoxProps,
	Center,
	Drawer,
	Group,
	Image,
	Modal,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from "@mantine/core";

import {
	iconBalance,
	iconChevronRight,
	iconClose,
	iconDownload,
	iconFlag,
	iconHelp,
	iconPlay,
	iconServer,
	iconTransfer,
	iconTune,
} from "~/util/icons";

import { useMemo, useState } from "react";
import { isDesktop } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useVersionCopy } from "~/hooks/debug";
import { useKeymap } from "~/hooks/keymap";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useDesktopUpdater } from "~/hooks/updater";
import { useIntent } from "~/hooks/url";
import { useInterfaceStore } from "~/stores/interface";
import type { Assign, FeatureCondition } from "~/types";
import { isDevelopment, isPreview } from "~/util/environment";
import { useFeatureFlags } from "~/util/feature-flags";
import { FeatureFlagsTab } from "./tabs/FeatureFlags";
import { LicensesTab } from "./tabs/Licenses";
import { ServingTab } from "./tabs/Serving";
import { TemplatesTab } from "./tabs/Templates";
import { PreferencesTab } from "./tabs/Preferences";
import { AboutTab } from "./tabs/About";
import { ManageDataTab } from "./tabs/ManageData";

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
		name: "Manage Data",
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
	setActiveTab: (tab: string) => void;
}

function SettingsSidebar({ activeTab, categories, setActiveTab, ...other }: SettingsSidebarProps) {
	const isLight = useIsLight();
	const logoUrl = useLogoUrl();

	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const { phase, progress, version, startUpdate } = useDesktopUpdater();

	const [copyDebug, clipboard] = useVersionCopy();
	const sidebarCategories = categories.filter((c) => !c.disabled || c.id === activeTab);

	const versionText = useMemo(() => {
		let builder = `Version ${import.meta.env.VERSION}`;

		if (isPreview) {
			builder += " (pre)";
		} else if (isDevelopment) {
			builder += " (dev)";
		}

		return builder;
	}, []);

	return (
		<Stack
			py="lg"
			px="xl"
			h="100%"
			w={250}
			bg={isLight ? "slate.0" : "slate.9"}
			gap={0}
			{...other}
		>
			<Stack
				pt="sm"
				pb="xl"
				gap="xs"
			>
				<Center>
					<Image
						h={26}
						src={logoUrl}
					/>
				</Center>
				<Text
					ta="center"
					c={clipboard.copied ? "surreal.6" : "slate"}
					size="xs"
					className={classes.version}
					onClick={copyDebug}
				>
					{clipboard.copied ? "Copied to clipboard!" : versionText}
				</Text>
			</Stack>
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
	const [activeTab, setActiveTab] = useState("behaviour");
	// const tabsRef = useRef<HTMLDivElement>(null);

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

	useIntent("open-settings", ({ tab }) => {
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
	});

	useKeymap([
		[
			"mod+,",
			() => {
				openHandle.open();
			},
		],
	]);

	const [overlaySidebar, overlaySidebarHandle] = useBoolean();

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
					pos="relative"
					id="bruh"
				>
					<SettingsSidebar
						activeTab={activeTab}
						categories={categories}
						setActiveTab={updateActiveTab}
						visibleFrom="md"
					/>
					<Drawer
						hiddenFrom="md"
						opened={overlaySidebar}
						onClose={overlaySidebarHandle.close}
						portalProps={{ target: "#bruh" }}
						overlayProps={{ opacity: 0 }}
						padding={0}
						offset={0}
						radius={0}
						size={250}
						styles={{
							body: {
								height: "100%",
							},
						}}
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
						px="xl"
						pt="xl"
						gap="md"
						flex={1}
						miw={0}
					>
						<Group>
							<Tooltip
								label="Toggle sidebar"
								position="right"
							>
								<ActionIcon
									hiddenFrom="md"
									onClick={overlaySidebarHandle.toggle}
								>
									<Icon path={iconChevronRight} />
								</ActionIcon>
							</Tooltip>
							<Title
								size={26}
								c="bright"
							>
								{activeCategory?.name ?? "Unknown"}
							</Title>
							<Spacer />
							<ActionIcon
								onClick={openHandle.close}
								aria-label="Close settings"
							>
								<Icon path={iconClose} />
							</ActionIcon>
						</Group>
						{Component && <Component />}
					</Stack>
				</Group>
			</Modal>
		</>
	);
}
