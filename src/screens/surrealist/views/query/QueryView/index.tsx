import { Box, Button, Group, Modal, Stack, TagsInput, Text, TextInput } from "@mantine/core";

import type { SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { surrealql } from "@surrealdb/codemirror";
import { memo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { CodeInput } from "~/components/Inputs";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { setEditorText } from "~/editor/helpers";
import { executeEditorQuery } from "~/editor/query";
import { useSetting } from "~/hooks/config";
import { useActiveQuery, useConnection, useSavedQueryTags } from "~/hooks/connection";
import { useEventSubscription } from "~/hooks/event";
import { usePanelMinSize } from "~/hooks/panels";
import { useConnectionAndView, useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { SavedQuery } from "~/types";
import { tagEvent } from "~/util/analytics";
import { SetQueryEvent } from "~/util/global-events";
import { ON_FOCUS_SELECT, newId } from "~/util/helpers";
import { iconCheck } from "~/util/icons";
import { HistoryDrawer } from "../HistoryDrawer";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { SavesDrawer } from "../SavesDrawer";
import { TabsPane } from "../TabsPane";
import { VariablesPane } from "../VariablesPane";

const QueryPaneLazy = memo(QueryPane);
const VariablesPaneLazy = memo(VariablesPane);
const ResultPaneLazy = memo(ResultPane);

export function QueryView() {
	const { saveQuery, updateQueryTab } = useConfigStore.getState();
	const queryTabList = useConnection((c) => c?.queryTabList);

	const [connection] = useConnectionAndView();
	const [orientation] = useSetting("appearance", "queryOrientation");
	const [editor, setEditor] = useState(new EditorView());
	const [variablesValid, setVariablesValid] = useState(true);

	const [showHistory, showHistoryHandle] = useDisclosure();
	const [showSaved, showSavedHandle] = useDisclosure();

	const [allowSelectionExecution] = useSetting("behavior", "querySelectionExecution");
	const [selection, setSelection] = useState<SelectionRange>();

	const tags = useSavedQueryTags();
	const active = useActiveQuery();

	const [isSaving, isSavingHandle] = useDisclosure();
	const [editingId, setEditingId] = useState("");
	const [saveName, setSaveName] = useInputState("");
	const [saveContent, setSaveContent] = useInputState("");
	const [saveTags, setSaveTags] = useInputState<string[]>([]);

	const handleSaveRequest = useStable(async () => {
		if (!active) {
			return;
		}

		setEditingId("");
		setSaveTags([]);
		setSaveName(active.name);
		setSaveContent(active.query);
		isSavingHandle.open();
	});

	const handleEditRequest = useStable(async (entry: SavedQuery) => {
		if (!active) {
			return;
		}

		setEditingId(entry.id);
		setSaveTags(entry.tags);
		setSaveName(entry.name);
		setSaveContent(entry.query);
		isSavingHandle.open();
	});

	const handleSaveQuery = useStable(async () => {
		if (!active || !saveName) {
			return;
		}

		saveQuery({
			id: editingId || newId(),
			name: saveName,
			query: saveContent,
			tags: saveTags,
		});

		isSavingHandle.close();
		tagEvent("query_save");
	});

	const showVariables = !!active?.showVariables;

	const setShowVariables = useStable((showVariables: boolean) => {
		if (!active || !connection) return;

		updateQueryTab(connection, {
			id: active?.id,
			showVariables,
		});
	});

	const closeVariables = useStable(() => {
		setShowVariables(false);
	});

	const variablesOrientation = orientation === "horizontal" ? "vertical" : "horizontal";
	const [hasLineNumbers] = useSetting("appearance", "queryLineNumbers");

	useIntent("open-saved-queries", showSavedHandle.open);
	useIntent("open-query-history", showHistoryHandle.open);
	useIntent("save-query", handleSaveRequest);
	useIntent("toggle-variables", () => setShowVariables(!showVariables));

	useIntent("run-query", () => {
		if (editor) {
			executeEditorQuery(editor, allowSelectionExecution);
		}
	});

	useEventSubscription(SetQueryEvent, (query) => {
		if (editor) {
			setEditorText(editor, query);
		}
	});

	const [minSidebarSize, rootRef] = usePanelMinSize(275);
	const [minResultHeight, wrapperRef] = usePanelMinSize(48, "height");

	const queryEditor = active && (
		<Box
			flex={1}
			h="100%"
			ref={wrapperRef}
		>
			<PanelGroup direction={orientation}>
				<Panel minSize={15}>
					<PanelGroup direction={variablesOrientation}>
						<Panel
							id="query"
							order={0}
							minSize={35}
						>
							<QueryPaneLazy
								activeTab={active}
								editor={editor}
								showVariables={showVariables}
								selection={selection}
								lineNumbers={hasLineNumbers}
								onSaveQuery={handleSaveRequest}
								setShowVariables={setShowVariables}
								onSelectionChange={setSelection}
								onEditorMounted={setEditor}
							/>
						</Panel>
						{showVariables && (
							<>
								<PanelDragger />
								<Panel
									id="variables"
									order={1}
									defaultSize={40}
									minSize={35}
								>
									<VariablesPaneLazy
										isValid={variablesValid}
										setIsValid={setVariablesValid}
										closeVariables={closeVariables}
										lineNumbers={hasLineNumbers}
										editor={editor}
									/>
								</Panel>
							</>
						)}
					</PanelGroup>
				</Panel>
				<PanelDragger />
				<Panel
					minSize={orientation === "horizontal" ? 35 : minResultHeight}
					defaultSize={50}
				>
					<ResultPaneLazy
						activeTab={active}
						selection={selection}
						editor={editor}
					/>
				</Panel>
			</PanelGroup>
		</Box>
	);

	return (
		<>
			<Box
				h="100%"
				ref={rootRef}
				pr="lg"
				pb="lg"
				pl={{ base: "lg", md: 0 }}
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSidebarSize === 0 ? 0 : 1 }}
				>
					{queryTabList && (
						<>
							<Panel
								defaultSize={minSidebarSize}
								minSize={minSidebarSize}
								maxSize={35}
								id="tabs"
								order={1}
							>
								<TabsPane
									openHistory={showHistoryHandle.open}
									openSaved={showSavedHandle.open}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel
						id="content"
						order={2}
					>
						{queryEditor}
					</Panel>
				</PanelGroup>
			</Box>

			<HistoryDrawer
				opened={showHistory}
				editor={editor}
				onClose={showHistoryHandle.close}
			/>

			<SavesDrawer
				opened={showSaved}
				editor={editor}
				onClose={showSavedHandle.close}
				onSaveQuery={handleSaveRequest}
				onEditQuery={handleEditRequest}
			/>

			<Modal
				zIndex={201}
				opened={isSaving}
				onClose={isSavingHandle.close}
				trapFocus={false}
				title={<PrimaryTitle>{editingId ? "Edit saved query" : "Save query"}</PrimaryTitle>}
			>
				<Form onSubmit={handleSaveQuery}>
					<Stack>
						<TextInput
							label="Name"
							autoFocus
							value={saveName}
							spellCheck={false}
							onChange={setSaveName}
							onFocus={ON_FOCUS_SELECT}
						/>

						<TagsInput
							data={tags}
							value={saveTags}
							onChange={setSaveTags}
							label={
								<Group gap={4}>
									Labels
									<Text
										span
										size="xs"
										c="slate"
									>
										(optional)
									</Text>
								</Group>
							}
						/>

						{editingId && (
							<CodeInput
								label="Query"
								value={saveContent}
								onChange={setSaveContent}
								multiline
								placeholder="SELECT * FROM something..."
								extensions={[surrealql()]}
							/>
						)}

						<Group>
							<Button
								onClick={isSavingHandle.close}
								variant="light"
								color="slate"
							>
								Close
							</Button>
							<Spacer />
							<Button
								type="submit"
								disabled={!saveName}
								variant="gradient"
								rightSection={<Icon path={iconCheck} />}
							>
								Save
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</>
	);
}

export default QueryView;
