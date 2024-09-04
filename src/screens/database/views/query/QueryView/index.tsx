import classes from "./style.module.scss";
import surrealistIcon from "~/assets/images/icon.webp";
import posthog from "posthog-js";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import { TabsPane } from "../TabsPane";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { memo, useState } from "react";
import { HistoryDrawer } from "../HistoryDrawer";
import { adapter, isMini } from "~/adapter";
import { Box, Button, Group, Modal, SegmentedControl, Stack, TagsInput, Text, TextInput } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { Image } from "@mantine/core";
import { PanelGroup, Panel } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { SavesDrawer } from "../SavesDrawer";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { ON_FOCUS_SELECT, newId } from "~/util/helpers";
import { useActiveQuery, useSavedQueryTags } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { SavedQuery } from "~/types";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconCheck } from "~/util/icons";
import { MiniAdapter } from "~/adapter/mini";
import { InPortal, createHtmlPortalNode } from "react-reverse-portal";
import { SelectionRange } from "@codemirror/state";
import { useIntent } from "~/hooks/url";
import { useSetting } from "~/hooks/config";
import { usePanelMinSize } from "~/hooks/panels";
import { CodeInput } from "~/components/Inputs";
import { surrealql } from "@surrealdb/codemirror";
import { useLogoUrl } from "~/hooks/brand";
import { executeUserQuery } from "~/screens/database/connection/connection";
import { EditorView } from "@codemirror/view";

const switchPortal = createHtmlPortalNode();

const QueryPaneLazy = memo(QueryPane);
const VariablesPaneLazy = memo(VariablesPane);
const ResultPaneLazy = memo(ResultPane);

export function QueryView() {
	const { saveQuery, updateQueryTab } = useConfigStore.getState();
	const logoUrl = useLogoUrl();

	const [orientation] = useSetting("appearance", "queryOrientation");
	const [editor, setEditor] = useState<EditorView | null>(null);
	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);

	const [showHistory, showHistoryHandle] = useDisclosure();
	const [showSaved, showSavedHandle] = useDisclosure();

	const [selection, setSelection] = useState<SelectionRange>();

	const tags = useSavedQueryTags();
	const active = useActiveQuery();

	const [isSaving, isSavingHandle] = useDisclosure();
	const [editingId, setEditingId] = useState("");
	const [saveName, setSaveName] = useInputState("");
	const [saveContent, setSaveContent] = useInputState("");
	const [saveTags, setSaveTags] = useInputState<string[]>([]);

	const squareCards = adapter instanceof MiniAdapter && adapter.hideBorder;

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
			tags: saveTags
		});

		isSavingHandle.close();

		posthog.capture('query_save');
	});

	const showVariables = !!active?.showVariables;

	const setShowVariables = useStable((showVariables: boolean) => {
		if (!active) return;

		updateQueryTab({
			id: active?.id,
			showVariables
		});
	});

	const closeVariables = useStable(() => {
		setShowVariables(false);
	});

	const variablesOrientation = orientation === "horizontal"
		? "vertical"
		: "horizontal";

	useIntent("open-saved-queries", showSavedHandle.open);
	useIntent("open-query-history", showHistoryHandle.open);
	useIntent("run-query", executeUserQuery);
	useIntent("save-query", handleSaveRequest);
	useIntent("toggle-variables", () => setShowVariables(!showVariables));

	const [minSize, ref] = usePanelMinSize(275);

	const queryEditor = (
		active && (
			<PanelGroup direction={orientation}>
				<Panel minSize={15}>
					{isMini ? (showVariables ? (
						<VariablesPaneLazy
							isValid={variablesValid}
							switchPortal={switchPortal}
							setIsValid={setVariablesValid}
							closeVariables={closeVariables}
							square={squareCards}
						/>
					) : (
						<QueryPaneLazy
							square={squareCards}
							activeTab={active}
							setIsValid={setQueryValid}
							switchPortal={switchPortal}
							selection={selection}
							showVariables={showVariables}
							onSaveQuery={handleSaveRequest}
							setShowVariables={setShowVariables}
							onSelectionChange={setSelection}
							onEditorMounted={setEditor}
						/>
					)) : (
						<PanelGroup direction={variablesOrientation}>
							<Panel minSize={35}>
								<QueryPaneLazy
									activeTab={active}
									setIsValid={setQueryValid}
									showVariables={showVariables}
									selection={selection}
									onSaveQuery={handleSaveRequest}
									setShowVariables={setShowVariables}
									onSelectionChange={setSelection}
									onEditorMounted={setEditor}
								/>
							</Panel>
							{showVariables && (
								<>
									<PanelDragger />
									<Panel defaultSize={40} minSize={35}>
										<VariablesPaneLazy
											isValid={variablesValid}
											setIsValid={setVariablesValid}
											closeVariables={closeVariables}
										/>
									</Panel>
								</>
							)}
						</PanelGroup>
					)}
				</Panel>
				<PanelDragger />
				<Panel minSize={15}>
					<ResultPaneLazy
						activeTab={active}
						isQueryValid={queryValid}
						selection={selection}
						editor={editor}
						square={squareCards}
					/>
				</Panel>
			</PanelGroup>
		)
	);

	return (
		<Stack
			gap="md"
			h="100%"
		>
			<InPortal node={switchPortal}>
				<SegmentedControl
					data={['Query', 'Variables']}
					value={showVariables ? 'Variables' : 'Query'}
					onChange={() => setShowVariables(!showVariables)}
					className={classes.switcher}
					radius="xs"
				/>
			</InPortal>

			{isMini ? (
				<>
					{!(adapter as MiniAdapter).hideTitlebar && (
						<Group>
							<Image
								src={logoUrl}
								style={{ pointerEvents: "none" }}
								height={20}
								width={20}
							/>
							<Image
								h={16}
								src={surrealistIcon}
							/>
							<Spacer />
						</Group>
					)}
					<Box flex={1}>
						{queryEditor}
					</Box>
				</>
			) : (
				<Box
					flex={1}
					ref={ref}
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					<PanelGroup direction="horizontal">
						<Panel
							defaultSize={minSize}
							minSize={minSize}
							maxSize={35}
						>
							<TabsPane
								openHistory={showHistoryHandle.open}
								openSaved={showSavedHandle.open}
							/>
						</Panel>
						<PanelDragger />
						<Panel>
							{queryEditor}
						</Panel>
					</PanelGroup>
				</Box>
			)}

			<HistoryDrawer
				opened={showHistory}
				onClose={showHistoryHandle.close}
			/>

			<SavesDrawer
				opened={showSaved}
				onClose={showSavedHandle.close}
				onSaveQuery={handleSaveRequest}
				onEditQuery={handleEditRequest}
			/>

			<Modal
				zIndex={201}
				opened={isSaving}
				onClose={isSavingHandle.close}
				trapFocus={false}
				title={
					<PrimaryTitle>
						{editingId ? "Edit saved query" : "Save query"}
					</PrimaryTitle>
				}
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
								extensions={[
									surrealql()
								]}
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
		</Stack>
	);
}

export default QueryView;