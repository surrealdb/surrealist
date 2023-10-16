import { useEffect, useState } from "react";
import { mdiCheck, mdiClose, mdiTablePlus } from "@mdi/js";
import { ActionIcon, Button, Divider, Group, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { SurrealistEditor } from "~/components/SurrealistEditor";

export interface CreatorPaneProps {
	activeSession: string | null;
	onClose: () => void;
	onSubmit: (table: string, json: string) => void;
}

export function CreatorPane(props: CreatorPaneProps) {
	const isLight = useIsLight();
	const [isInvalid, setIsInvalid] = useState(false);
	const [tableName, setTableName] = useInputState("");
	const [contentText, setContentText] = useState("{\n    \n}");

	const jsonAlert = isInvalid ? <Text color="red">Invalid record JSON</Text> : undefined;

	useEffect(() => {
		setTableName(props.activeSession || "");
	}, [props.activeSession]);

	const handleSubmit = useStable(() => {
		if (!props.activeSession || !contentText) {
			return;
		}

		props.onSubmit(tableName, contentText);
	});

	const updateContent = useStable((content: string | undefined) => {
		if (contentText === content) {
			return;
		}

		setContentText(content || "");

		try {
			const json = content || "{}";
			const parsed = JSON.parse(json);

			if (typeof parsed !== "object") {
				throw new TypeError("Invalid JSON");
			}

			setIsInvalid(false);
		} catch {
			setIsInvalid(true);
		}
	});

	return (
		<Panel
			title="Create Record"
			icon={mdiTablePlus}
			rightSection={
				<Group align="center">
					{jsonAlert && (
						<>
							{jsonAlert}
							<Divider orientation="vertical" color={isLight ? "light.0" : "dark.5"} />
						</>
					)}

					<ActionIcon onClick={props.onClose} title="Close creator">
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
				</Group>
			}>
			<TextInput mb="xs" label="Record name" value={tableName} onChange={setTableName} />

			<Text color="dark.0" size="sm">
				Record contents
			</Text>

			<div
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 62,
					top: 94,
				}}
			>
				<SurrealistEditor
					language="json"
					value={contentText}
					onChange={updateContent}
					options={{
						wrappingStrategy: "advanced",
						wordWrap: "off",
						suggest: {
							showProperties: false,
						},
					}}
				/>
			</div>

			<Button
				disabled={isInvalid || !tableName}
				onClick={handleSubmit}
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 12,
				}}>
				Create record
				<Icon path={mdiCheck} right />
			</Button>
		</Panel>
	);
}
