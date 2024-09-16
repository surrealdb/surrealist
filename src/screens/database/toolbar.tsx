import {
	ActionIcon,
	Badge,
	Button,
	Group,
	HoverCard,
	Menu,
	Modal,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { sleep } from "radash";
import { useState } from "react";
import { ActionBar } from "~/components/ActionBar";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { SidebarToggle } from "~/components/SidebarToggle";
import { Spacer } from "~/components/Spacer";
import { DATASETS } from "~/constants";
import { useConnection, useIsConnected, useMinimumVersion } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/hooks/url";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import type { DataSet } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { showInfo } from "~/util/helpers";
import { iconChevronRight, iconFile, iconReset, iconStar } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { openCloudAuthentication } from "../cloud-manage/api/auth";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { DatabaseList } from "./components/DatabaseList";
import { NamespaceList } from "./components/NamespaceList";
import { executeQuery, openConnection } from "./connection/connection";

export function DatabaseToolbar() {
	const { clearQueryResponse, clearGraphqlResponse } = useDatabaseStore.getState();
	const { readChangelog } = useInterfaceStore.getState();
	const { updateConnection } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const showChangelog = useInterfaceStore((s) => s.showChangelogAlert);
	const hasReadChangelog = useInterfaceStore((s) => s.hasReadChangelog);
	const authState = useCloudStore((s) => s.authState);
	const isConnected = useIsConnected();
	const connection = useConnection();

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
		confirmText: "Reset",
		confirmProps: { variant: "gradient" },
		onConfirm: async () => {
			openConnection();

			if (connection) {
				for (const query of connection.queries) {
					clearQueryResponse(query.id);
				}

				clearGraphqlResponse(connection.id);
			}
		},
	});

	const [datasets, applyDataset, isDatasetLoading] = useDatasets();

	const openChangelog = useStable(() => {
		dispatchIntent("open-changelog");
		readChangelog();
	});

	const [isSupported, version] = useMinimumVersion(import.meta.env.SDB_VERSION);
	const isSandbox = connection?.id === "sandbox";
	const showNS = !isSandbox && isConnected;
	const showDB = showNS && connection?.lastNamespace;

	return (
		<>
			<SidebarToggle />
			
			<ConnectionStatus />

			{authState === "unauthenticated" && connection?.authentication?.mode === "cloud" && (
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
					<Tooltip label="Reset sandbox environment">
						<ActionIcon
							color="slate"
							variant="subtle"
							onClick={resetSandbox}
							aria-label="Reset sandbox environment"
						>
							<Icon path={iconReset} />
						</ActionIcon>
					</Tooltip>
					<Menu
						transitionProps={{
							transition: "scale-y",
						}}
					>
						<Menu.Target>
							<Tooltip label="Apply demo dataset">
								<ActionIcon
									color="slate"
									variant="subtle"
									aria-label="Apply demo dataset"
									loading={isDatasetLoading}
								>
									<Icon path={iconFile} />
								</ActionIcon>
							</Tooltip>
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
