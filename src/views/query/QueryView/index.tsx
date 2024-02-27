import surrealistIcon from "~/assets/images/logo.png";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import { TabsPane } from "../TabsPane";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { useState } from "react";
import { HistoryDrawer } from "../HistoryDrawer";
import { isEmbed } from "~/adapter";
import { Button, Group, Modal, Stack, TagsInput, Text, TextInput, Textarea } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { Actions } from "../Actions";
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

export function QueryView() {
	const { saveQuery } = useConfigStore.getState();
	const isLight = useIsLight();

	const [showVariables, showVariablesHandle] = useDisclosure();
	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);

	const [showHistory, showHistoryHandle] = useDisclosure();
	const [showSaved, showSavedHandle] = useDisclosure();

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
	});

	return (
		<Stack
			gap="md"
			h="100%"
		>
			{isEmbed && (
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
					<Actions
						queryTab={active!}
						showVariables={showVariables}
						toggleVariables={showVariablesHandle.toggle}
					/>
				</Group>
			)}

			<Group
				flex={1}
				wrap="nowrap"
				gap="var(--surrealist-divider-size)"
			>
				{!isEmbed && (
					<TabsPane
						openHistory={showHistoryHandle.open}
						openSaved={showSavedHandle.open}
					/>
				)}
				<PanelGroup direction="vertical">
					<Panel minSize={25}>
						<PanelGroup direction="horizontal">
							<Panel minSize={25}>
								<QueryPane
									showVariables={showVariables}
									isValid={queryValid}
									setIsValid={setQueryValid}
									toggleVariables={showVariablesHandle.toggle}
									onSaveQuery={handleSaveRequest}
								/>
							</Panel>
							{showVariables && (
								<>
									<PanelDragger />
									<Panel defaultSize={25} minSize={25} maxSize={40}>
										<VariablesPane
											isValid={variablesValid}
											setIsValid={setVariablesValid}
											closeVariables={showVariablesHandle.close}
										/>
									</Panel>
								</>
							)}
						</PanelGroup>
					</Panel>
					<PanelDragger />
					<Panel minSize={25}>
						<ResultPane />
					</Panel>
				</PanelGroup>
			</Group>

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
