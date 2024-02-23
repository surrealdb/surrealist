import surrealistLogo from "~/assets/images/logo-small.png";
import { Group, Button, Modal, TextInput, Image, Center, ActionIcon } from "@mantine/core";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { updateTitle } from "~/util/helpers";
import { Form } from "../Form";
import { Icon } from "../Icon";
import { LocalDatabase } from "./LocalDatabase";
import { Spacer } from "../Spacer";
import { ViewMode } from "~/types";
import { adapter } from "~/adapter";
import { useConnection } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { closeConnection, openConnection } from "~/database";
import { useDatabaseStore } from "~/stores/database";
import { Connections } from "./connections";
import { showNotification } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { ConsoleDrawer } from "./ConsoleDrawer";
import { iconClose, iconReset } from "~/util/icons";

export interface ToolbarProps {
	viewMode: ViewMode;
	onCreateTab: () => void;
}

export function Toolbar(props: ToolbarProps) {
	const { updateConnection } = useConfigStore.getState();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);
	
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

	const connect = useStable(() => {
		openConnection();
	});

	const resetSandbox = useStable(() => {
		closeConnection();
		openConnection();

		showNotification({
			message: "Sandbox environment reset",
		});
	});

	const isSandbox = connection?.id === "sandbox";

	return (
		<>
			{/* <Group h={24} bg="dark.9" data-tauri-drag-region /> */}
			<Group
				p="xs"
				gap="sm"
				pos="relative"
				align="center"
				wrap="nowrap"
				h={64}
			>
				<Center w={52}>
					<Image
						style={{ pointerEvents: "none", userSelect: "none" }}
						src={surrealistLogo}
						width={38}
					/>
				</Center>
				
				<Connections
				
				/>

				{connection && (isConnected ? (isSandbox ? (
					<ActionIcon
						color="slate"
						variant="transparent"
						title="Reset sandbox environment"
						onClick={resetSandbox}
					>
						<Icon path={iconReset} />
					</ActionIcon>
				) : (
					<ActionIcon
						color="slate"
						variant="transparent"
						title="Disconnect"
						onClick={closeConnection}
					>
						<Icon path={iconClose} />
					</ActionIcon>
				)) : (
					<Button
						h={42}
						radius="lg"
						color="surreal"
						variant="light"
						loading={isConnecting}
						onClick={connect}
					>
						Connect
					</Button>
				))}

				<Spacer />

				{adapter.isServeSupported && (
					<LocalDatabase
						toggleConsole={setShowConsole.toggle}
					/>
				)}

				<Modal
					opened={!!editingTab}
					onClose={closeEditingTab}
					withCloseButton={false}
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
