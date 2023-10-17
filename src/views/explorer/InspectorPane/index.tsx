import {
	mdiArrowLeftBold,
	mdiArrowRightBold,
	mdiCheck,
	mdiCircleMedium,
	mdiClose,
	mdiCodeJson,
	mdiDelete,
	mdiRefresh,
	mdiSwapVertical,
	mdiWrench,
} from "@mdi/js";

import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { ActionIcon, Button, Center, Group, Modal, Paper, Tabs, Text, TextInput } from "@mantine/core";
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
import { closeEditor, setInspectorRecord } from "~/stores/explorer";
import { useInputState } from "@mantine/hooks";

export interface InspectorPaneProps {
	history: HistoryHandle<any>;
}

export function InspectorPane({ history }: InspectorPaneProps) {
	const isLight = useIsLight();
	const isShifting = useActiveKeys("Shift");
	const record = useStoreValue((state) => state.explorer.inspectorRecord);
	
	const [isDeleting, setIsDeleting] = useState(false);
	const [recordId, setRecordId] = useInputState(history.current);

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

		store.dispatch(setInspectorRecord({
			content,
			inputs,
			outputs
		}));
	});

	const saveRecord = useStable(async () => {
		const surreal = getSurreal();

		if (!surreal || !record) {
			return;
		}

		const json = JSON.stringify(record.content);

		await surreal.query(`UPDATE ${history.current} CONTENT ${json}`);
	});

	const isEdge = record?.content?.in && record?.content?.out;

	const gotoRecord = useStable((e: any) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		history.push(recordId);
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

	const onBodyChange = useStable((value: string) => {
		store.dispatch(setInspectorRecord({
			...record!,
			content: JSON.parse(value)
		}));
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
					<ActionIcon onClick={history.goBack} title="Go back">
						<Icon color={history.hasBack ? "light.4" : isLight ? "light.0" : "dark.4"} path={mdiArrowLeftBold} />
					</ActionIcon>

					<ActionIcon onClick={history.goForward} title="Go forward">
						<Icon
							color={history.hasForward ? "light.4" : isLight ? "light.0" : "dark.4"}
							path={mdiArrowRightBold}
						/>
					</ActionIcon>

					<ActionIcon onClick={handleRefresh} title="Refetch record">
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>

					<ActionIcon onClick={requestDelete} title="Delete record (Hold shift to force)" disabled={!record}>
						<Icon color={isShifting ? "red" : "light.4"} path={mdiDelete} />
					</ActionIcon>

					<ActionIcon onClick={handleClose} title="Close inspector">
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
				</Group>
			}
		>
			<TextInput
				mb="xs"
				value={recordId}
				onBlur={gotoRecord}
				onKeyDown={gotoRecord}
				onChange={setRecordId}
				onFocus={(e) => e.target.select()}
				rightSectionWidth={76}
				rightSection={
					isEdge && (
						<Paper
							title="This record is an edge"
							bg={isLight ? "light.0" : "light.6"}
							c={isLight ? "light.6" : "white"}
							px="xs">
							Edge
						</Paper>
					)
				}
				styles={(theme) => ({
					input: {
						backgroundColor: isLight ? "white" : theme.fn.themeColor("dark.9"),
						color: theme.fn.themeColor(record ? "surreal" : "red"),
						fontFamily: "JetBrains Mono",
						fontSize: 14,
						height: 42,
					},
				})}
			/>
			{record ? (
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
							isLight={isLight}
							value={JSON.stringify(record.content)}
							onChange={onBodyChange}
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
					<Text color="light.5">Record does not exist</Text>
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
	isLight: boolean;
	value: string;
	onChange: (value: string) => void;
}

function ContentTab({ isLight, value, onChange }: ContentTabProps) {
	const [contentText, setContentText] = useState("");
	const [isDirty, setIsDirty] = useState(false);

	const updateContent = useStable((content: string | undefined) => {
		if (contentText === content) {
			return;
		}

		setContentText(content || "");
		setIsDirty(true);
	});

	const saveRecord = useStable(() => {
		// props.onContentChange(contentText);
		setIsDirty(false);
	});

	const isBodyValid = useMemo(() => {
		try {
			const json = value || "{}";
			const parsed = JSON.parse(json);

			if (typeof parsed !== "object") {
				throw new TypeError("Invalid JSON");
			}

			return true;
		} catch {
			return false;
		}
	}, [value]);

	// useEffect(() => {
	// 	setContentText(JSON.stringify(props.content, null, 4));
	// 	setIsDirty(false);
	// }, [props.content]);

	return (
		<>
			<SurrealistEditor
				noExpand
				language="json"
				value={contentText}
				onChange={updateContent}
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
				onClick={saveRecord}
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
		<div
			style={{
				position: "absolute",
				insetInline: 12,
				bottom: 42,
				top: 102,
			}}>
			<Text color={isLight ? "blue.9" : "light.0"} size="lg" mt={4}>
				Incoming relations
			</Text>

			<RelationsList name="incoming" relations={inputs} onOpen={onOpen} />

			<Text color={isLight ? "blue.9" : "light.0"} size="lg" mt="xl">
				Outgoing relations
			</Text>

			<RelationsList name="outgoing" relations={outputs} onOpen={onOpen} />
		</div>
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
