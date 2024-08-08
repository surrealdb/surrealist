import { Group, Button, Modal, TextInput, ActionIcon, Tooltip, Menu } from "@mantine/core";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { showInfo } from "~/util/helpers";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { iconChevronRight, iconFile, iconReset, iconStar } from "~/util/icons";
import { DATASETS } from "~/constants";
import { DataSet } from "~/types";
import { syncDatabaseSchema } from "~/util/schema";
import { useFeatureFlags } from "~/util/feature-flags";
import { useInterfaceStore } from "~/stores/interface";
import { dispatchIntent } from "~/hooks/url";
import { useConfirmation } from "~/providers/Confirmation";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { openConnection, executeQuery } from "./connection/connection";
import { sleep } from "radash";
import { Spacer } from "~/components/Spacer";
import { ActionBar } from "~/components/ActionBar";
import { ConnectionList } from "./components/ConnectionList";
import { DatabaseList } from "./components/DatabaseList";
import { NamespaceList } from "./components/NamespaceList";
import { openCloudAuthentication } from "../cloud-manage/auth";
import { useCloudStore } from "~/stores/cloud";

export function DatabaseToolbar() {
	const { clearQueryResponse, clearGraphqlResponse } = useDatabaseStore.getState();
	const { updateConnection } = useConfigStore.getState();
	const { readChangelog } = useInterfaceStore.getState();
	const [flags] = useFeatureFlags();

	const showChangelog = useInterfaceStore((s) => s.showChangelogAlert);
	const hasReadChangelog = useInterfaceStore((s) => s.hasReadChangelog);
	const authState = useCloudStore((s) => s.authState);
	const isConnected = useIsConnected();
	const connection = useConnection();

	const [isDatasetLoading, setDatasetLoading] = useState(false);
	const [editingTab, setEditingTab] = useState<string | null>(null);
	const [tabName, setTabName] = useState("");

	const closeEditingTab = useStable(() => {
		setEditingTab(null);
	});

	const saveTabName = useStable(() => {
		updateConnection({
			id: editingTab!,
			name: tabName,
		});

		closeEditingTab();
	});

	const resetSandbox = useConfirmation({
		title: "Reset sandbox environment",
		message: "This will clear all data and query responses. Your queries will not be affected. Are you sure you want to continue?",
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

	const applyDataset = useStable(async (info: DataSet) => {
		setDatasetLoading(true);

		try {
			const dataset = await fetch(info.url).then(res => res.text());

			await sleep(50);
			await executeQuery(dataset);
			await syncDatabaseSchema();

			showInfo({
				title: "Dataset loaded",
				subtitle: `${info.name} has been applied`
			});
		} finally {
			setDatasetLoading(false);
		}
	});

	const openChangelog = useStable(() => {
		dispatchIntent("open-changelog");
		readChangelog();
	});

	const isSandbox = connection?.id === "sandbox";
	const showNS = !isSandbox && isConnected;
	const showDB = showNS && connection?.lastNamespace;

	return (
		<>
			<ConnectionList />

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
							transition: "scale-y"
						}}
					>
						<Menu.Target>
							<Tooltip label="Load demo dataset">
								<ActionIcon
									color="slate"
									variant="subtle"
									aria-label="Load demo dataset"
									loading={isDatasetLoading}
								>
									<Icon path={iconFile} />
								</ActionIcon>
							</Tooltip>
						</Menu.Target>
						<Menu.Dropdown miw={200}>
							<Menu.Label>
								Select a dataset
							</Menu.Label>
							{Object.entries(DATASETS).map(([id, info]) => (
								<Menu.Item
									key={id}
									onClick={() => applyDataset(info)}
								>
									{info.name}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
				</>
			)}

			<Spacer />

			{(flags.changelog === 'auto' ? showChangelog : flags.changelog !== 'hidden') && (
				<Button
					h={34}
					size="xs"
					radius="xs"
					color="slate"
					variant={(flags.changelog === 'auto' ? hasReadChangelog : flags.changelog === 'read') ? "filled" : "gradient"}
					style={{ border: "none" }}
					onClick={openChangelog}
					leftSection={
						<Icon path={iconStar} left />
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
