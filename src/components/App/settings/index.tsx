import {
	type BoxProps,
	Center,
	Divider,
	Drawer,
	Group,
	Image,
	Modal,
	Stack,
	Title,
} from "@mantine/core";
import {
	Icon,
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
} from "@surrealdb/ui";
import { useState } from "react";
import { isDesktop } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdateState } from "~/hooks/updater";
import type { Assign, FeatureCondition } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
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
	onClose?: () => void;
}

function SettingsSidebar({
	activeTab,
	categories,
	withBorder,
	setActiveTab,
	onClose,
	...other
}: SettingsSidebarProps) {
	const logoUrl = useLogoUrl();
	const { hasUpdate } = useDesktopUpdateState();

	const openUpdate = useStable(() => {
		dispatchIntent("open-update");
		onClose?.();
	});

	const sidebarCategories = categories.filter((c) => !c.disabled || c.id === activeTab);

	return (
		<Stack
			p="lg"
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
					w="auto"
					src={logoUrl}
				/>
			</Center>
			<Stack
				gap="xs"
				flex={1}
			>
				{hasUpdate && (
					<>
						<Entry
							leftSection={<Icon path={iconDownload} />}
							onClick={openUpdate}
						>
							Update Surrealist
						</Entry>
						<Divider />
					</>
				)}
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

				{/* <Button
							onClick={openUpdate}
							color="violet"
							variant="filled"
							radius="sm"
							h="unset"
							p="sm"
							styles={{
								root: {
									boxShadow: "var(--mantine-shadow-md), var(--mantine-shadow-sm)",
								},
								inner: {
									justifyContent: "start",
								},
							}}
						>
							<Group wrap="nowrap">
								<ThemeIcon
									variant="outline"
									color="white"
								>
									<Icon path={iconDownload} />
								</ThemeIcon>
								<Box ta="start">
									<Text
										fw={600}
										fz="lg"
										c="white"
									>
										Update Surrealist
									</Text>
									<Text
										c="white"
										fz="sm"
										opacity={0.75}
									>
										Version {version} available
									</Text>
								</Box>
							</Group>
						</Button> */}
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
		<Modal
			opened={open}
			onClose={openHandle.close}
			padding={0}
			size={1200}
			styles={{
				content: {
					overflow: "hidden",
				},
			}}
		>
			<Group
				h="calc(100vh - 100px)"
				mah={800}
				gap="xs"
				align="stretch"
				wrap="nowrap"
				pos="relative"
			>
				<div id="settings" />
				<SettingsSidebar
					activeTab={activeTab}
					categories={categories}
					setActiveTab={updateActiveTab}
					withBorder
					visibleFrom="md"
					onClose={openHandle.close}
				/>
				<Divider
					orientation="vertical"
					visibleFrom="md"
				/>
				<Drawer
					withCloseButton={false}
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
						onClose={() => {
							overlaySidebarHandle.close();
							openHandle.close();
						}}
					/>
				</Drawer>
				<Stack
					pl="xl"
					pt="xl"
					gap={0}
					flex={1}
					miw={0}
				>
					<Group
						mb={26}
						mx="xs"
					>
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
	);
}
