import { editor } from "monaco-editor";
import { mdiArrowLeftBold, mdiArrowRightBold, mdiCheck, mdiCircleMedium, mdiClose, mdiCodeJson, mdiDelete, mdiRefresh, mdiSwapVertical, mdiWrench } from "@mdi/js";
import { FocusEvent, KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { baseEditorConfig } from "~/util/editor";
import { ActionIcon, Button, Center, Group, Modal, Paper, Tabs, Text, TextInput, Title } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { OpenFn } from "~/typings";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { useInputState } from "@mantine/hooks";
import { Spacer } from "~/components/Spacer";
import { useActiveKeys } from "~/hooks/keys";
import { getSurreal } from "~/surreal";
import { HistoryHandle } from "~/hooks/history";
import Editor from "@monaco-editor/react";

export interface InspectorPaneProps {
	history: HistoryHandle<any>;
	activeRecord: any;
	onClose: () => void;
	onSelectRecord: OpenFn;
	onContentChange: (json: string) => void;
	onRefreshContent: () => void;
	onRefresh: () => void;
}

export function InspectorPane(props: InspectorPaneProps) {
	const isLight = useIsLight();
	const isShifting = useActiveKeys('Shift');
	const [isInvalid, setIsInvalid] = useState(false);
	const [recordId, setRecordId] = useInputState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDirty, setIsDirty] = useState(false);

	const record = props.activeRecord;

	useEffect(() => {
		setRecordId(record.content.id || '');
	}, [record.content.id]);
	
	const isEdge = record.content?.in && record.content?.out;
	const recordExists = !record.invalid;

	const gotoRecord = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Enter') {
			return;
		}

		props.onSelectRecord((e.target as HTMLInputElement).value);
	});

	const handleDelete = useStable(async () => {
		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		setIsDeleting(false);
		props.onClose();

		await surreal.query(`DELETE ${recordId}`);

		props.onRefresh();
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
		if (isDirty) {
			alert('You sure?');
		}
		
		props.onRefreshContent();
	});

	const handleSetDirty = useStable((dirty: boolean) => {
		setIsDirty(dirty);
	});

	return (
		<Panel
			title="Inspector"
			icon={mdiWrench}
			rightSection={
				<Group align="center">
					<ActionIcon
						onClick={props.history.goBack}
						title="Go back"
					>
						<Icon
							color={props.history.hasBack ? 'light.4' : isLight ? 'light.0' : 'dark.4' }
							path={mdiArrowLeftBold}
						/>
					</ActionIcon>

					<ActionIcon
						onClick={props.history.goForward}
						title="Go forward"
					>
						<Icon
							color={props.history.hasForward ? 'light.4' : isLight ? 'light.0' : 'dark.4' }
							path={mdiArrowRightBold}
						/>
					</ActionIcon>

					<ActionIcon
						onClick={handleRefresh}
						title="Refresh"
					>
						<Icon
							color="light.4"
							path={mdiRefresh}
						/>
					</ActionIcon>

					<ActionIcon
						onClick={requestDelete}
						title="Delete record (Hold shift to force)"
						disabled={!recordExists}
					>
						<Icon color={isShifting ? 'red' : 'light.4'} path={mdiDelete} />
					</ActionIcon>

					<ActionIcon
						onClick={props.onClose}
						title="Close inspector"
					>
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
				onFocus={e => e.target.select()}
				rightSectionWidth={76}
				rightSection={isEdge && (
					<Paper
						title="This record is an edge"
						bg={isLight ? 'light.0' : 'light.6'}
						c={isLight ? 'light.6' : 'white'}
						px="xs"
					>
						Edge
					</Paper>	
				)}
				styles={theme => ({
					input: {
						backgroundColor: isLight ? 'white' : theme.fn.themeColor('dark.9'),
						color: theme.fn.themeColor(recordExists ? 'surreal' : 'red'),
						fontFamily: 'JetBrains Mono',
						fontSize: 14,
						height: 42
					}
				})}
			/>
			{recordExists ? (
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
							content={record.content}
							isInvalid={isInvalid}
							setIsInvalid={setIsInvalid}
							onContentChange={props.onContentChange}
							onDirtyChange={handleSetDirty}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="relations">
						<RelationsTab
							isLight={isLight}
							inputs={record.inputs}
							outputs={record.outputs}
							onSelectRecord={props.onSelectRecord}
						/>
					</Tabs.Panel>
				</Tabs>	
			) : (
				<Center my="xl">
					<Text color="light.5">
						Record does not exist
					</Text>
				</Center>
			)}

			<Modal
				opened={isDeleting}
				onClose={closeDelete}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Are you sure?
					</Title>
				}
			>
				<Text color={isLight ? 'light.6' : 'light.1'}>
					You are about to delete this record. This action cannot be undone.
				</Text>
				<Group mt="lg">
					<Button
						onClick={closeDelete}
						color={isLight ? 'light.5' : 'light.3'}
						variant="light"
					>
						Close
					</Button>
					<Spacer />
					<Button
						color="red"
						onClick={handleDelete}
					>
						Delete
					</Button>
				</Group>
			</Modal>
			
		</Panel>
	)
}

interface ContentTabProps {
	isLight: boolean;
	content: any;
	isInvalid: boolean;
	setIsInvalid: (isInvalid: boolean) => void;
	onContentChange: (json: string) => void;
	onDirtyChange: (dirty: boolean) => void;
}

function ContentTab(props: ContentTabProps) {
	const [contentText, setContentText] = useState('');
	const [isDirty, setIsDirty] = useState(false);

	const updateContent = useStable((content: string | undefined) => {
		if (contentText === content) {
			return;
		}
		
		props.onDirtyChange(true);
		setContentText(content || '');
		setIsDirty(true);

		try {
			const json = content || '{}';
			const parsed = JSON.parse(json);

			if (typeof parsed !== 'object' || !parsed.id) {
				throw new Error();
			}

			props.setIsInvalid(false);
		} catch {
			props.setIsInvalid(true);
		}
	});

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			wrappingStrategy: 'advanced',
			wordWrap: 'off',
			suggest: {
				showProperties: false
			}
		}
	}, []);

	const saveRecord = useStable(() => {
		props.onContentChange(contentText);
		props.onDirtyChange(false);
		setIsDirty(false);
	});

	useEffect(() => {
		props.onDirtyChange(false);
		setContentText(JSON.stringify(props.content, null, 4));
		setIsDirty(false);
	}, [props.content]);

	return (
		<>
			<div
				style={{
					position: 'absolute',
					insetInline: 12,
					bottom: 62,
					top: 109
				}}
			>
				<Editor
					theme={props.isLight ? 'surrealist' : 'surrealist-dark'}
					value={contentText}
					onChange={updateContent}
					options={options}
					language="json"
				/>
			</div>

			<Button
				disabled={props.isInvalid || !isDirty}
				onClick={saveRecord}
				style={{
					position: 'absolute',
					insetInline: 12,
					bottom: 12
				}}
			>
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
	onSelectRecord: OpenFn;
}

function RelationsTab({ isLight, inputs, outputs, onSelectRecord }: RelationsTabProps) {
	return (
		<div
			style={{
				position: 'absolute',
				insetInline: 12,
				bottom: 42,
				top: 102
			}}
		>
			<Text
				color={isLight ? 'blue.9' : 'light.0'}
				size="lg"
				mt={4}
			>
				Incoming relations
			</Text>

			<RelationsList
				name="incoming"
				isLight={isLight}
				relations={inputs}
				onSelectRecord={onSelectRecord}
			/>

			<Text
				color={isLight ? 'blue.9' : 'light.0'}
				size="lg"
				mt="xl"
			>
				Outgoing relations
			</Text>

			<RelationsList
				name="outgoing"
				isLight={isLight}
				relations={outputs}
				onSelectRecord={onSelectRecord}
			/>
		</div>
	);
}

interface RelationsListProps {
	name: string;
	isLight: boolean;
	relations: any[];
	onSelectRecord: OpenFn;
}

function RelationsList({ name, isLight, relations, onSelectRecord }: RelationsListProps) {
	if (relations.length === 0) {
		return (
			<Text>
				No {name} relations found
			</Text>
		)
	}

	return (
		<>
			{relations.map((relation, i) => (
				<Group key={relation} spacing="xs" noWrap>
					<Icon
						path={mdiCircleMedium}
					/>
					<RecordLink
						value={relation}
						onRecordClick={onSelectRecord}
					/>
				</Group>
			))}
		</>
	);
}