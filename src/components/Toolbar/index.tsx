import classes from "./style.module.scss";
import { Group, Button, Modal, TextInput, ActionIcon, Tooltip, Box, Menu } from "@mantine/core";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { showInfo, updateTitle } from "~/util/helpers";
import { Form } from "../Form";
import { Icon } from "../Icon";
import { LocalDatabase } from "./LocalDatabase";
import { Spacer } from "../Spacer";
import { adapter } from "~/adapter";
import { useConnection } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { closeConnection, openConnection } from "~/database";
import { useDatabaseStore } from "~/stores/database";
import { Connections } from "./connections";
import { useDisclosure } from "@mantine/hooks";
import { ConsoleDrawer } from "./ConsoleDrawer";
import { iconFile, iconReset } from "~/util/icons";
import { HelpAndSupport } from "./HelpAndSupport";
import { DATASETS } from "~/constants";
import { DataSet } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { getSurreal } from "~/util/surreal";

export function Toolbar() {
	const { updateConnection } = useConfigStore.getState();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const connection = useConnection();

	const [showConsole, setShowConsole] = useDisclosure();
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

		updateTitle();
		closeEditingTab();
	});

	const resetSandbox = useStable(() => {
		closeConnection();
		openConnection();

		showInfo({
			title: "Sandbox reset",
			subtitle: "Existing data has been dropped",
		});
	});

	const applyDataset = useStable(async (info: DataSet) => {
		const dataset = await fetch(info.url).then(res => res.text());

		await getSurreal()?.query(dataset);
		await fetchDatabaseSchema();

		showInfo({
			title: "Dataset loaded",
			subtitle: `${info.name} has been applied`
		});
	});

	const isSandbox = connection?.id === "sandbox";

	return (
		<>
			<Group
				p="sm"
				gap="sm"
				pos="relative"
				align="center"
				wrap="nowrap"
				className={classes.root}
				h={64}
			>
				<Box w={56} />

				<Connections />

				{isConnected && isSandbox && (
					<>
						<Tooltip label="Reset sandbox environment">
							<ActionIcon
								color="slate"
								variant="subtle"
								onClick={resetSandbox}
							>
								<Icon path={iconReset} />
							</ActionIcon>
						</Tooltip>
						<Menu withArrow>
							<Menu.Target>
								<Tooltip label="Load demo dataset">
									<ActionIcon
										color="slate"
										variant="subtle"
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

				{connection && adapter.isServeSupported && (
					<LocalDatabase
						toggleConsole={setShowConsole.toggle}
					/>
				)}

				<HelpAndSupport />

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
								onChange={(e) => setTabName(e.target.value)}
								autoFocus
								onFocus={(e) => e.target.select()}
							/>
							<Button type="submit">Rename</Button>
						</Group>
					</Form>
				</Modal>

				<ConsoleDrawer
					opened={showConsole}
					onClose={setShowConsole.close}
				/>
			</Group>
		</>
	);
}
