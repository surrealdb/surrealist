import surrealistLogo from "~/assets/icon.png";
import { Group, Button, Modal, TextInput, Image, Divider } from "@mantine/core";
import { mdiHistory, mdiStar } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { store, useStoreValue } from "~/store";
import { updateTitle } from "~/util/helpers";
import { Form } from "../Form";
import { Icon } from "../Icon";
import { LocalDatabase } from "../LocalDatabase";
import { Spacer } from "../Spacer";
import { Settings } from "../Settings";
import { ViewMode } from "~/types";
import { adapter } from "~/adapter";
import { Selector } from "./selector";
import { useTabsList } from "~/hooks/environment";
import { ViewTab } from "../ViewTab";
import { Exporter } from "../Exporter";
import { updateSession, setShowQueryListing, setQueryListingMode } from "~/stores/config";

export interface ToolbarProps {
	viewMode: ViewMode;
	onCreateTab: (environment: string) => void;
}

export function Toolbar(props: ToolbarProps) {
	const isLight = useIsLight();
	const activeSession = useStoreValue((state) => state.config.activeTab);

	const enableListing = useStoreValue((state) => state.config.enableListing);
	const queryListing = useStoreValue((state) => state.config.queryListing);

	const [editingTab, setEditingTab] = useState<string | null>(null);
	const [tabName, setTabName] = useState("");

	const pinnedTabs = useTabsList().filter((tab) => tab.pinned);

	const closeEditingTab = useStable(() => {
		setEditingTab(null);
	});

	const saveTabName = useStable(() => {
		store.dispatch(updateSession({
			id: editingTab!,
			name: tabName,
		}));

		updateTitle();
		closeEditingTab();
	});

	const toggleHistory = useStable(() => {
		if (queryListing === "history") {
			store.dispatch(setShowQueryListing(!enableListing));
		} else {
			store.dispatch(setQueryListingMode("history"));
			store.dispatch(setShowQueryListing(true));
		}
	});

	const toggleFavorites = useStable(() => {
		if (queryListing === "favorites") {
			store.dispatch(setShowQueryListing(!enableListing));
		} else {
			store.dispatch(setQueryListingMode("favorites"));
			store.dispatch(setShowQueryListing(true));
		}
	});

	return (
		<Group p="xs" pos="relative" spacing="sm" bg={isLight ? "white" : "dark.7"} align="center" noWrap>
			{pinnedTabs.length > 0 && (
				<Group
					spacing={8}
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

			<Image style={{ pointerEvents: "none", userSelect: "none" }} src={surrealistLogo} width={38} />

			<Selector
				active={activeSession}
				isLight={isLight}
				onCreateSession={props.onCreateTab}
			/>

			<Spacer />

			{props.viewMode == "query" && (
				<>
					<Button px="xs" color={isLight ? "light.0" : "dark.4"} title="Toggle history" onClick={toggleHistory}>
						<Icon path={mdiHistory} color={isLight ? "light.8" : "white"} />
					</Button>

					<Button px="xs" color={isLight ? "light.0" : "dark.4"} title="Toggle favorites" onClick={toggleFavorites}>
						<Icon path={mdiStar} color={isLight ? "light.8" : "white"} />
					</Button>

					<Divider
						orientation="vertical"
						color={isLight ? 'gray.1' : 'gray.9'}
					/>
				</>
			)}

			{adapter.isServeSupported && (
				<LocalDatabase />
			)}

			<Exporter />

			<Settings />

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
