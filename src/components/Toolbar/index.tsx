import surrealistLogo from "~/assets/surrealist.png";
import { Group, Button, Modal, TextInput, Image, Divider, Center, ActionIcon } from "@mantine/core";
import { mdiHistory, mdiStar } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { updateTitle } from "~/util/helpers";
import { Form } from "../Form";
import { Icon } from "../Icon";
import { LocalDatabase } from "../LocalDatabase";
import { Spacer } from "../Spacer";
import { ViewMode } from "~/types";
import { adapter } from "~/adapter";
import { useConnection } from "~/hooks/connection";
import { Exporter } from "../Exporter";
import { useConfigStore } from "~/stores/config";
import { Importer } from "../Importer";
import { openConnection } from "~/database";
import { useDatabaseStore } from "~/stores/database";
import { Connections } from "./connections";

export interface ToolbarProps {
	viewMode: ViewMode;
	onCreateTab: () => void;
}

export function Toolbar(props: ToolbarProps) {
	const { updateConnection } = useConfigStore.getState();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);
	
	const connection = useConnection();
	const isLight = useIsLight();

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

	return (
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

			{connection && !isConnected && (
				<Button
					color="slate"
					variant="light"
					loading={isConnecting}
					onClick={connect}
				>
					Connect
				</Button>
			)}

			<Spacer />

			{props.viewMode == "query" && (
				<>
					<ActionIcon size="xl" title="Toggle history" onClick={() => {}}>
						<Icon path={mdiHistory} />
					</ActionIcon>

					<ActionIcon size="xl" title="Toggle favorites" onClick={() => {}}>
						<Icon path={mdiStar} />
					</ActionIcon>

					<Divider
						orientation="vertical"
						color={isLight ? 'gray.1' : 'gray.9'}
					/>
				</>
			)}

			{adapter.isServeSupported && (
				<LocalDatabase />
			)}

			<Importer />

			<Exporter />

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
		</Group>
	);
}
