import {
	mdiArrowLeftBold,
	mdiCheck,
	mdiCircleMedium,
	mdiClose,
	mdiCodeJson,
	mdiDelete,
	mdiRefresh,
	mdiSwapVertical,
	mdiWrench,
} from "@mdi/js";

import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { ActionIcon, Button, Center, Group, Modal, Paper, ScrollArea, Stack, Tabs, Text, TextInput } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { OpenFn } from "~/types";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { Spacer } from "~/components/Spacer";
import { useActiveKeys } from "~/hooks/keys";
import { HistoryHandle } from "~/hooks/history";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ModalTitle } from "~/components/ModalTitle";
import { getSurreal } from "~/util/connection";
import { store, useStoreValue } from "~/store";
import { closeEditor, openCreator, setActiveRecord, setInspectorId, setInspectorQuery } from "~/stores/explorer";
import { useStoreState } from "~/hooks/store";
import { EventBus } from "~/hooks/event";

export interface InspectorPaneProps {
	history: HistoryHandle<any>;
	refreshEvent: EventBus;
}

export function InspectorPane({ history, refreshEvent }: InspectorPaneProps) {
	const isLight = useIsLight();
	const isShifting = useActiveKeys("Shift");
	const [isDeleting, setIsDeleting] = useState(false);
	const record = useStoreValue((state) => state.explorer.activeRecord);

	const isEmpty = record === null;
	const isPresent = record?.exists === true;

	const [editingId, setEditingId] = useStoreState(
		(state) => state.explorer.inspectorId,
		(value) => setInspectorId(value)
	);

	const [editingQuery, setEditingQuery] = useStoreState(
		(state) => state.explorer.inspectorQuery,
		(value) => setInspectorQuery(value)
	);

	const fetchRecord = useStable(async (id: string | null) => {
		const surreal = getSurreal();

		if (!surreal || !id) {
			return;
		}

		const contentQuery = `SELECT * FROM ${id}`;
		const inputQuery = `SELECT <-? AS relations FROM ${id}`;
		const outputsQuery = `SELECT ->? AS relations FROM ${id}`;

		const response = await surreal.query(`${contentQuery};${inputQuery};${outputsQuery}`);
		const content = response[0].result[0];
		const inputs = response[1].result[0]?.relations || [];
		const outputs = response[2].result[0]?.relations || [];

		const json = JSON.stringify(content, null, 4);

		setEditingId(id);
		setEditingQuery(json);

		store.dispatch(setActiveRecord({
			exists: !!content,
			initial: json,
			content,
			inputs,
			outputs
		}));
	});

	const saveRecord = useStable(async () => {
		const surreal = getSurreal();

		if (!surreal || !isPresent) {
			return;
		}

		await surreal.query(`UPDATE ${history.current} CONTENT ${editingQuery}`);

		fetchRecord(history.current);
		refreshEvent.dispatch();
	});

	const isEdge = record?.content?.in && record?.content?.out;

	const gotoRecord = useStable((e: any) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		history.push(editingId);
	});

	const handleDelete = useStable(async () => {
		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		setIsDeleting(false);
		handleClose();

		await surreal.query(`DELETE ${history.current}`);

		history.clear();
		refreshEvent.dispatch();
	});

	const requestDelete = useStable((e: MouseEvent<HTMLButtonElement>) => {
		if (e.shiftKey) {
			handleDelete();
		} else {
			setIsDeleting(true);
		}
	});

	const closeDelete = useStable(() => {
		setIsDeleting(false);
	});

	const handleRefresh = useStable(() => {
		fetchRecord(history.current);
	});

	const handleClose = useStable(() => {
		store.dispatch(closeEditor());
	});

	const onIdChange = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setEditingId(e.target.value);
	});

	const createNew = useStable(() => {
		store.dispatch(openCreator(editingId));
	});

	useEffect(() => {
		fetchRecord(history.current);
	}, [history.current]);

	return (
		<Panel
			title="Inspector"
			icon={mdiWrench}
			rightSection={
				<Group align="center">
					{!isEmpty && (
						<>
							<ActionIcon onClick={history.pop} title="Previous record">
								<Icon color={history.canPop ? "light.4" : isLight ? "light.0" : "dark.4"} path={mdiArrowLeftBold} />
							</ActionIcon>

							<ActionIcon onClick={handleRefresh} title="Refetch record">
								<Icon color="light.4" path={mdiRefresh} />
							</ActionIcon>

							<ActionIcon onClick={requestDelete} title="Delete record (Hold shift to force)">
								<Icon color={isShifting ? "red" : "light.4"} path={mdiDelete} />
							</ActionIcon>
						</>
					)}

					<ActionIcon onClick={handleClose} title="Close inspector">
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
				</Group>
			}
		>
			<TextInput
				mb="xs"
				value={editingId}
				onBlur={gotoRecord}
				onKeyDown={gotoRecord}
				onChange={onIdChange}
				onFocus={(e) => e.target.select()}
				placeholder="table:id"
				rightSectionWidth={76}
				rightSection={
					isEdge && (
						<Paper
							title="This record is an edge"
							bg={isLight ? "light.0" : "light.6"}
							c={isLight ? "light.6" : "white"}
							radius="xl"
							px="xs"
						>
							Edge
						</Paper>
					)
				}
				styles={(theme) => ({
					input: {
						backgroundColor: isLight ? "white" : theme.fn.themeColor("dark.9"),
						color: theme.fn.themeColor(record?.exists === false ? "red" : "surreal"),
						fontFamily: "JetBrains Mono",
						fontSize: 14,
						height: 42,
					},
				})}
			/>
			{isEmpty ? (
				<Center my="xl">
					<Text color={isLight ? "light.7" : "light.3"}>
						Enter a valid record id to inspect
					</Text>
				</Center>
			) : isPresent ? (
				<Tabs defaultValue="content">
					<Tabs.List grow>
						<Tabs.Tab value="content">
							Content
							<Icon path={mdiCodeJson} size={0.85} right />
						</Tabs.Tab>
						<Tabs.Tab value="relations">
							Relations
							<Icon path={mdiSwapVertical} size={0.85} right />
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="content">
						<ContentTab
							isDirty={editingQuery !== record.initial}
							value={editingQuery}
							onChange={setEditingQuery}
							onSave={saveRecord}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="relations">
						<RelationsTab
							isLight={isLight}
							inputs={record.inputs}
							outputs={record.outputs}
							onOpen={history.push}
						/>
					</Tabs.Panel>
				</Tabs>
			) : (
				<Center my="xl">
					<Stack>
						<Text color={isLight ? "light.7" : "light.3"}>
							Record not found in database
						</Text>
						<Center>
							<Button
								size="xs"
								onClick={createNew}
							>
								Create record...
							</Button>
						</Center>
					</Stack>
				</Center>
			)}

			<Modal
				opened={isDeleting}
				onClose={closeDelete}
				title={<ModalTitle>Are you sure?</ModalTitle>}>
				<Text color={isLight ? "light.6" : "light.1"}>
					You are about to delete this record. This action cannot be undone.
				</Text>
				<Group mt="lg">
					<Button onClick={closeDelete} color={isLight ? "light.5" : "light.3"} variant="light">
						Close
					</Button>
					<Spacer />
					<Button color="red" onClick={handleDelete}>
						Delete
					</Button>
				</Group>
			</Modal>
		</Panel>
	);
}

interface ContentTabProps {
	value: string;
	isDirty: boolean;
	onChange: (value: string) => void;
	onSave: () => void;
}

function ContentTab({ value, isDirty, onChange, onSave }: ContentTabProps) {

	const isBodyValid = useMemo(() => {
		try {
			const parsed = JSON.parse(value);

			if (typeof parsed !== "object") {
				throw new TypeError("Invalid JSON");
			}

			return true;
		} catch {
			return false;
		}
	}, [value]);

	return (
		<>
			<SurrealistEditor
				noExpand
				language="json"
				value={value}
				onChange={onChange}
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 62,
					top: 109,
				}}
				options={{
					wrappingStrategy: "advanced",
					wordWrap: "off",
					suggest: {
						showProperties: false,
					},
				}}
			/>

			<Button
				disabled={!isBodyValid || !isDirty}
				onClick={onSave}
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 12,
				}}>
				Save record
				<Icon path={mdiCheck} right />
			</Button>
		</>
	);
}

interface RelationsTabProps {
	isLight: boolean;
	inputs: any[];
	outputs: any[];
	onOpen: OpenFn;
}

function RelationsTab({ isLight, inputs, outputs, onOpen }: RelationsTabProps) {
	return (
		<ScrollArea
			style={{
				position: "absolute",
				insetInline: 12,
				bottom: 0,
				top: 100,
			}}>

			<Text color={isLight ? "blue.9" : "light.0"} size="lg" mt={4}>
				Incoming relations
			</Text>

			<RelationsList name="incoming" relations={inputs} onOpen={onOpen} />

			<Text color={isLight ? "blue.9" : "light.0"} size="lg" mt="xl">
				Outgoing relations
			</Text>

			<RelationsList name="outgoing" relations={outputs} onOpen={onOpen} />
		</ScrollArea>
	);
}

interface RelationsListProps {
	name: string;
	relations: any[];
	onOpen: OpenFn;
}

function RelationsList({ name, relations, onOpen }: RelationsListProps) {
	if (relations.length === 0) {
		return <Text>No {name} relations found</Text>;
	}

	return (
		<>
			{relations.map((relation, i) => (
				<Group key={relation} spacing="xs" noWrap>
					<Icon path={mdiCircleMedium} />
					<RecordLink value={relation} onRecordClick={onOpen} />
				</Group>
			))}
		</>
	);
}
