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
import { Selector } from "./selector";
import { useTabsList } from "~/hooks/environment";
import { ViewTab } from "../ViewTab";
import { Exporter } from "../Exporter";
import { useConfigStore } from "~/stores/config";
import { Importer } from "../Importer";
import { openConnection } from "~/database";
import { useDatabaseStore } from "~/stores/database";

export interface ToolbarProps {
	viewMode: ViewMode;
	onCreateTab: (environment: string) => void;
}

export function Toolbar(props: ToolbarProps) {
	const updateSession = useConfigStore((s) => s.updateSession);
	const setShowQueryListing = useConfigStore((s) => s.setShowQueryListing);
	const setQueryListingMode = useConfigStore((s) => s.setQueryListingMode);
	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);
	
	const isLight = useIsLight();
	const activeSession = useConfigStore((s) => s.activeTab);

	const enableListing = useConfigStore((s) => s.enableListing);
	const queryListing = useConfigStore((s) => s.queryListing);

	const [editingTab, setEditingTab] = useState<string | null>(null);
	const [tabName, setTabName] = useState("");

	const pinnedTabs = useTabsList().filter((tab) => tab.pinned);

	const closeEditingTab = useStable(() => {
		setEditingTab(null);
	});

	const saveTabName = useStable(() => {
		updateSession({
			id: editingTab!,
			name: tabName,
		});

		updateTitle();
		closeEditingTab();
	});

	const toggleHistory = useStable(() => {
		if (queryListing === "history") {
			setShowQueryListing(!enableListing);
		} else {
			setQueryListingMode("history");
			setShowQueryListing(true);
		}
	});

	const toggleFavorites = useStable(() => {
		if (queryListing === "favorites") {
			setShowQueryListing(!enableListing);
		} else {
			setQueryListingMode("favorites");
			setShowQueryListing(true);
		}
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
			{pinnedTabs.length > 0 && (
				<Group
					gap={8}
					style={{
						position: "absolute",
						inset: 0,
						marginInline: "auto",
						width: "max-content",
					}}>
					{pinnedTabs.map((tab) => (
						<ViewTab key={tab.id} sessionInfo={tab} />
					))}
				</Group>
			)}

			<Center w={52}>
				<Image
					style={{ pointerEvents: "none", userSelect: "none" }}
					src={surrealistLogo}
					width={38}
				/>
			</Center>

			<Selector
				active={activeSession}
				isLight={isLight}
				onCreateSession={props.onCreateTab}
			/>

			{!isConnected && (
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
					<ActionIcon size="xl" title="Toggle history" onClick={toggleHistory}>
						<Icon path={mdiHistory} />
					</ActionIcon>

					<ActionIcon size="xl" title="Toggle favorites" onClick={toggleFavorites}>
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
