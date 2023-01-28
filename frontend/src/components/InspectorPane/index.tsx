import { editor } from "monaco-editor";
import { mdiArrowDown, mdiArrowUp, mdiCheck, mdiClose, mdiCodeJson, mdiWrench } from "@mdi/js";
import Editor from "@monaco-editor/react";
import { Panel } from "../Panel";
import { useEffect, useMemo, useState } from "react";
import { baseEditorConfig } from "~/util/editor";
import { ActionIcon, Button, Divider, Group, Paper, Tabs, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { Icon } from "../Icon";
import { useStable } from "~/hooks/stable";

export interface InspectorPaneProps {
	record: any;
	onClose: () => void;
	onContentChange: (json: string) => void;
}

export function InspectorPane(props: InspectorPaneProps) {
	const isLight = useIsLight();
	const [isInvalid, setIsInvalid] = useState(false);

	const jsonAlert = isInvalid
		? <Text color="red">Invalid record JSON</Text>
		: undefined;

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
			<Paper
				c="surreal"
				ff="JetBrains Mono"
				radius="md"
				bg="dark.9"
				p="xs"
				mb="xs"
			>
				{props.record.content.id}
			</Paper>

			<Tabs defaultValue="content">
				<Tabs.List grow>
					<Tabs.Tab value="content">
						Content
						<Icon path={mdiCodeJson} size={0.9} right />
					</Tabs.Tab>
					<Tabs.Tab value="inputs">
						Inputs
						<Icon path={mdiArrowDown} size={0.9} right />
					</Tabs.Tab>
					<Tabs.Tab value="outputs">
						Outputs
						<Icon path={mdiArrowUp} size={0.9} right />
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

				<Tabs.Panel value="inputs">
					<InputsOutputsTab
						relations={props.record.inputs}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="outputs">
				<InputsOutputsTab
						relations={props.record.outputs}
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
	});

	useEffect(() => {
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
					top: 102
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

interface InputsOutputsTabProps {
	relations: any; 
}

function InputsOutputsTab(props: InputsOutputsTabProps) {
	return (
		<div
			style={{
				position: 'absolute',
				insetInline: 12,
				bottom: 42,
				top: 102
			}}
		>
			{JSON.stringify(props.relations, null, 4)}
		</div>
	);
}