import classes from "./style.module.scss";
import surrealistIcon from "~/assets/images/logo.png";
import posthog from "posthog-js";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import { TabsPane } from "../TabsPane";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { useState } from "react";
import { HistoryDrawer } from "../HistoryDrawer";
import { adapter, isMini } from "~/adapter";
import { Box, Button, Group, Modal, SegmentedControl, Stack, TagsInput, Text, TextInput, Textarea } from "@mantine/core";
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
import { ModalTitle } from "~/components/ModalTitle";
import { iconCheck } from "~/util/icons";
import { SurrealistLogo } from "~/components/SurrealistLogo";
import { useIsLight } from "~/hooks/theme";
import { MiniAdapter } from "~/adapter/mini";
import { useBoolean } from "~/hooks/boolean";
import { InPortal, createHtmlPortalNode } from "react-reverse-portal";
import { SelectionRange } from "@codemirror/state";
import { useIntent } from "~/hooks/url";
import { executeUserQuery } from "~/connection";
import { useSetting } from "~/hooks/config";
import { useCompatHotkeys } from "~/hooks/hotkey";
import { usePanelMinSize } from "~/hooks/panels";

const switchPortal = createHtmlPortalNode();

export function QueryView() {
	const { saveQuery } = useConfigStore.getState();
	const isLight = useIsLight();

	const [orientation] = useSetting("appearance", "queryOrientation");
	const [showVariables, showVariablesHandle] = useBoolean();
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

	const runQuery = useStable(() => {
		if (!active) return;

		executeUserQuery({
			override: selection?.empty === false
				? active.query.slice(selection.from, selection.to)
				: undefined
		});
	});

	const variablesOrientation = orientation === "horizontal"
		? "vertical"
		: "horizontal";

	useIntent("open-saved-queries", showSavedHandle.open);
	useIntent("open-query-history", showHistoryHandle.open);
	useIntent("run-query", runQuery);
	useIntent("save-query", handleSaveRequest);
	useIntent("toggle-variables", showVariablesHandle.toggle);

	useCompatHotkeys([
		["F9", () => runQuery()],
		["mod+Enter", () => runQuery()],
	]);

	const [minSize, ref] = usePanelMinSize(275);

	const queryEditor = (
		active && (
			<PanelGroup direction={orientation}>
				<Panel minSize={35}>
					{isMini ? (showVariables ? (
						<VariablesPane
							isValid={variablesValid}
							switchPortal={switchPortal}
							setIsValid={setVariablesValid}
							closeVariables={showVariablesHandle.close}
						/>
					) : (
						<QueryPane
							activeTab={active}
							setIsValid={setQueryValid}
							switchPortal={switchPortal}
							selection={selection}
							showVariables={showVariables}
							onSaveQuery={handleSaveRequest}
							setShowVariables={showVariablesHandle.set}
							onSelectionChange={setSelection}
						/>
					)) : (
						<PanelGroup direction={variablesOrientation}>
							<Panel minSize={35}>
								<QueryPane
									activeTab={active}
									setIsValid={setQueryValid}
									showVariables={showVariables}
									selection={selection}
									onSaveQuery={handleSaveRequest}
									setShowVariables={showVariablesHandle.set}
									onSelectionChange={setSelection}
								/>
							</Panel>
							{showVariables && (
								<>
									<PanelDragger />
									<Panel defaultSize={40} minSize={35}>
										<VariablesPane
											isValid={variablesValid}
											setIsValid={setVariablesValid}
											closeVariables={showVariablesHandle.close}
										/>
									</Panel>
								</>
							)}
						</PanelGroup>
					)}
				</Panel>
				<PanelDragger />
				<Panel minSize={35}>
					<ResultPane
						activeTab={active}
						isQueryValid={queryValid}
						selection={selection}
						onRunQuery={runQuery}
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
					onChange={showVariablesHandle.toggle}
					className={classes.switcher}
					radius="xs"
				/>
			</InPortal>

			{isMini ? (
				<>
					{!(adapter as MiniAdapter).hideTitlebar && (
						<Group>
							<Image
								src={surrealistIcon}
								style={{ pointerEvents: "none" }}
								height={20}
								width={20}
							/>
							<SurrealistLogo
								h={16}
								c={isLight ? "slate.9" : "white"}
							/>
							<Spacer />
						</Group>
					)}
					<Box flex={1}>
						{queryEditor}
					</Box>
				</>
			) : (
				<Box flex={1} ref={ref}>
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
					<ModalTitle>
						{editingId ? "Edit query" : "Save query"}
					</ModalTitle>
				}
			>
				<Form onSubmit={handleSaveQuery}>
					<Stack>
						<TextInput
							label="Name"
							autoFocus
							value={saveName}
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
							<Textarea
								label="Query"
								rows={6}
								value={saveContent}
								onChange={setSaveContent}
								styles={{
									input: {
										fontFamily: "JetBrains Mono"
									}
								}}
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
