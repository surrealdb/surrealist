import { mdiCheck, mdiCircleMedium, mdiClose, mdiCodeJson, mdiSwapVertical, mdiWrench } from "@mdi/js";
import { editor } from "monaco-editor";
import Editor from "@monaco-editor/react";
import { FocusEvent, Fragment, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { baseEditorConfig } from "~/util/editor";
import { ActionIcon, Button, Divider, Group, Paper, Tabs, Text, TextInput } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { OpenFn } from "~/typings";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { useInputState } from "@mantine/hooks";

export interface InspectorPaneProps {
	record: any;
	onClose: () => void;
	onSelectRecord: OpenFn;
	onContentChange: (json: string) => void;
}

export function InspectorPane(props: InspectorPaneProps) {
	const isLight = useIsLight();
	const [isInvalid, setIsInvalid] = useState(false);
	const [recordId, setRecordId] = useInputState('');

	useEffect(() => {
		setRecordId(props.record.content.id || '');
	}, [props.record.content.id]);

	const jsonAlert = isInvalid
		? <Text color="red">Invalid record JSON</Text>
		: undefined;
	
	const isEdge = props.record.content?.in && props.record.content?.out;

	const gotoRecord = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Enter') {
			return;
		}

		props.onSelectRecord((e.target as HTMLInputElement).value);
	});

	return (
		<Panel
			title="Inspector"
			icon={mdiWrench}
			rightSection={
				<Group align="center">
					{jsonAlert && (
						<>
							{jsonAlert}
							<Divider
								orientation="vertical"
								color={isLight ? 'light.0' : 'dark.5'}
							/>
						</>
					)}

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
						color: theme.fn.themeColor('surreal'),
						fontFamily: 'JetBrains Mono',
						fontSize: 14,
						height: 42
					}
				})}
			/>
			<Tabs defaultValue="content">
				<Tabs.List grow>
					<Tabs.Tab value="content">
						Content
						<Icon path={mdiCodeJson} size={0.9} right />
					</Tabs.Tab>
					<Tabs.Tab value="relations">
						Relations
						<Icon path={mdiSwapVertical} size={0.9} right />
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="content">
					<ContentTab
						isLight={isLight}
						content={props.record.content}
						isInvalid={isInvalid}
						setIsInvalid={setIsInvalid}
						onContentChange={props.onContentChange}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="relations">
					<RelationsTab
						isLight={isLight}
						inputs={props.record.inputs}
						outputs={props.record.outputs}
						onSelectRecord={props.onSelectRecord}
					/>
				</Tabs.Panel>
			</Tabs>
			
		</Panel>
	)
}

interface ContentTabProps {
	isLight: boolean;
	content: any;
	isInvalid: boolean;
	setIsInvalid: (isInvalid: boolean) => void;
	onContentChange: (json: string) => void;
}

function ContentTab(props: ContentTabProps) {
	const [contentText, setContentText] = useState('');
	const [isDirty, setIsDirty] = useState(false);

	const updateContent = useStable((content: string | undefined) => {
		if (contentText === content) {
			return;
		}
		
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
		setIsDirty(false);
	});

	useEffect(() => {
		setContentText(JSON.stringify(props.content, null, 4));
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
			>
				Input relations
			</Text>

			<RelationsList
				name="input"
				isLight={isLight}
				relations={inputs}
				onSelectRecord={onSelectRecord}
			/>

			<Text
				color={isLight ? 'blue.9' : 'light.0'}
				size="lg"
				mt="xl"
			>
				Output relations
			</Text>

			<RelationsList
				name="output"
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
				<Fragment key={relation}>
					<Group spacing="xs">
						<Icon
							path={mdiCircleMedium}
						/>
						<RecordLink
							value={relation}
							onRecordClick={onSelectRecord}
						/>
					</Group>
					{i !== relations.length - 1 && (
						<Divider
							color={isLight ? 'light.0' : 'dark.5'}
						/>
					)}
				</Fragment>
			))}
		</>
	);
}