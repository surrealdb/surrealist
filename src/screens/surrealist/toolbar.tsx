import {
	Badge,
	Button,
	Group,
	HoverCard,
	Menu,
	Modal,
	Text,
	TextInput,
} from "@mantine/core";

import { useState } from "react";
import { ActionBar } from "~/components/ActionBar";
import { ActionButton } from "~/components/ActionButton";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { SidebarToggle } from "~/components/SidebarToggle";
import { Spacer } from "~/components/Spacer";
import { useConnection, useIsConnected, useMinimumVersion } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { useFeatureFlags } from "~/util/feature-flags";
import { iconChevronRight, iconReset, iconStar, iconTable } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { openCloudAuthentication } from "./cloud-panel/api/auth";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { DatabaseList } from "./components/DatabaseList";
import { NamespaceList } from "./components/NamespaceList";
import { resetConnection } from "./connection/connection";

export function SurrealistToolbar() {
	const { readChangelog } = useInterfaceStore.getState();
	const { updateConnection } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const showChangelog = useInterfaceStore((s) => s.showChangelogAlert);
	const hasReadChangelog = useInterfaceStore((s) => s.hasReadChangelog);
	const authState = useCloudStore((s) => s.authState);
	const isConnected = useIsConnected();

	const [id, namespace, authMode] = useConnection((c) => [
		c?.id,
		c?.lastNamespace,
		c?.authentication.mode,
	]);

	const [editingTab, setEditingTab] = useState<string | null>(null);
	const [tabName, setTabName] = useState("");

	const closeEditingTab = useStable(() => {
		setEditingTab(null);
	});

	const saveTabName = useStable(() => {
		if (!editingTab) return;

		updateConnection({
			id: editingTab,
			name: tabName,
		});

		closeEditingTab();
	});

	const resetSandbox = useConfirmation({
		title: "Reset sandbox environment",
		message:
			"This will clear all data and query responses. Your queries will not be affected. Are you sure you want to continue?",
		skippable: true,
		confirmText: "Reset",
		confirmProps: { variant: "gradient" },
		onConfirm: resetConnection,
	});

	const [datasets, applyDataset, isDatasetLoading] = useDatasets();

	const openChangelog = useStable(() => {
		dispatchIntent("open-changelog");
		readChangelog();
	});

	const [isSupported, version] = useMinimumVersion(import.meta.env.SDB_VERSION);
	const isSandbox = id === "sandbox";
	const showNS = !isSandbox && id && isConnected;
	const showDB = showNS && namespace;

	return (
		<>
			<SidebarToggle />

			<ConnectionStatus />

			{authState === "unauthenticated" && authMode === "cloud" && (
				<Button
					color="orange"
					variant="light"
					size="xs"
					onClick={openCloudAuthentication}
				>
					Sign in to Surreal Cloud
				</Button>
			)}

			{showNS && (
				<>
					<Icon
						path={iconChevronRight}
						size="xl"
						color="slate.5"
						mx={-8}
					/>

					<NamespaceList />
				</>
			)}

			{showDB && (
				<>
					<Icon
						path={iconChevronRight}
						size="xl"
						color="slate.5"
						mx={-8}
					/>

					<DatabaseList />
				</>
			)}

			{isConnected && isSandbox && (
				<>
					<ActionButton
						color="slate"
						variant="subtle"
						label="Reset sandbox environment"
						onClick={resetSandbox}
					>
						<Icon path={iconReset} />
					</ActionButton>
					<Menu
						transitionProps={{
							transition: "scale-y",
						}}
					>
						<Menu.Target>
							<div>
								<ActionButton
									color="slate"
									variant="subtle"
									label="Apply demo dataset"
									loading={isDatasetLoading}
								>
									<Icon path={iconTable} />
								</ActionButton>
							</div>
						</Menu.Target>
						<Menu.Dropdown miw={200}>
							<Menu.Label>Select a dataset</Menu.Label>
							{datasets.map(({ label, value }) => (
								<Menu.Item
									key={value}
									onClick={() => applyDataset(value)}
								>
									{label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
				</>
			)}

			{isConnected && !isSupported && (
				<HoverCard>
					<HoverCard.Target>
						<Badge
							variant="light"
							color="orange"
							h={28}
						>
							Unsupported database version
						</Badge>
					</HoverCard.Target>
					<HoverCard.Dropdown>
						<Text>
							We recommend using at least{" "}
							<Text
								span
								c="bright"
							>
								SurrealDB {import.meta.env.SDB_VERSION}
							</Text>
						</Text>
						<Text>
							The current version is{" "}
							<Text
								span
								c="bright"
							>
								SurrealDB {version}
							</Text>
						</Text>
					</HoverCard.Dropdown>
				</HoverCard>
			)}

			<Spacer />

			{(flags.changelog === "auto" ? showChangelog : flags.changelog !== "hidden") && (
				<Button
					h={34}
					size="xs"
					radius="xs"
					color="slate"
					variant={
						(flags.changelog === "auto" ? hasReadChangelog : flags.changelog === "read")
							? "filled"
							: "gradient"
					}
					style={{ border: "none" }}
					onClick={openChangelog}
					leftSection={
						<Icon
							path={iconStar}
							left
						/>
					}
				>
					See what's new in {import.meta.env.VERSION}
				</Button>
			)}

			<ActionBar />

			<Modal
				opened={!!editingTab}
				onClose={closeEditingTab}
			>
				<Form onSubmit={saveTabName}>
					<Group>
						<TextInput
							style={{ flex: 1 }}
							placeholder="Enter tab name"
							value={tabName}
							spellCheck={false}
							onChange={(e) => setTabName(e.target.value)}
							autoFocus
							onFocus={(e) => e.target.select()}
						/>
						<Button type="submit">Rename</Button>
					</Group>
				</Form>
			</Modal>
		</>
	);
}
