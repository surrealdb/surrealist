import { ActionIcon, Badge, Button, Drawer, Group, Paper, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/util/surreal";
import { iconClose, iconPlus } from "~/util/icons";
import { RecordsChangedEvent } from "~/util/global-events";
import { useTableNames } from "~/hooks/schema";
import { editor } from "monaco-editor";
import { tb } from "~/util/helpers";
import { Label } from "~/components/Scaffold/settings/utilities";
import { json } from "@codemirror/lang-json";

export interface CreatorDrawerProps {
	opened: boolean;
	table: string;
	onClose: () => void;
}

export function CreatorDrawer({ opened, table, onClose }: CreatorDrawerProps) {
	const [recordTable, setRecordTable] = useState('');
	const [recordId, setRecordId] = useInputState('');
	const [recordBody, setRecordBody] = useState('');
	const tables = useTableNames();

	const isBodyValid = useMemo(() => {
		try {
			const parsed = JSON.parse(recordBody);

			if (typeof parsed !== "object") {
				throw new TypeError("Invalid JSON");
			}

			return true;
		} catch {
			return false;
		}
	}, [recordBody]);

	const handleSubmit = useStable(async () => {
		const surreal = getSurreal();

		if (!isBodyValid || !surreal) {
			return;
		}

		const record = recordId
			? `${tb(recordTable)}:${tb(recordId)}`
			: tb(recordTable);

		await surreal.query(`CREATE ${record} CONTENT ${recordBody}`);

		onClose();
		RecordsChangedEvent.dispatch();
	});

	const focusEditor = useStable((editor: editor.IStandaloneCodeEditor) => {
		editor.focus();
		editor.setPosition({ lineNumber: 2, column: 5 });
	});

	useLayoutEffect(() => {
		if (opened) {
			setRecordTable(table);
			setRecordId('');
			setRecordBody('{\n    \n}');
		}
	}, [opened]);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size="lg"
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
					gap: "var(--mantine-spacing-lg)"
				}
			}}
		>
			<Group gap="sm">
				<ModalTitle>
					<Icon left path={iconPlus} size="sm" />
					Create record
				</ModalTitle>

				<Spacer />

				{!isBodyValid && (
					<Badge
						color="red"
						variant="light"
					>
						Invalid record json
					</Badge>
				)}

				<ActionIcon onClick={onClose}>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>

			<Stack flex={1} gap={6}>
				<SimpleGrid cols={2}>
					<Select
						data={tables}
						label="Table"
						value={recordTable}
						onChange={setRecordTable as any}
					/>
					<TextInput
						mb="xs"
						label="Record id"
						value={recordId}
						onChange={setRecordId}
						placeholder="Leave empty to generate"
					/>
				</SimpleGrid>

				<Stack flex={1} gap={2}>
					<Label>Contents</Label>
					<Paper
						p="xs"
						flex={1}
						withBorder
					>
						<SurrealistEditor
							language="json"
							autoSize
							value={recordBody}
							onChange={setRecordBody}
							onMount={focusEditor}
							options={{
								wrappingStrategy: "advanced",
								wordWrap: "off",
								suggest: {
									showProperties: false,
								},
							}}
							extensions={[
								json()
							]}
						/>
					</Paper>
				</Stack>
			</Stack>

			<Button
				disabled={!isBodyValid}
				variant="gradient"
				onClick={handleSubmit}
				rightSection={
					<Icon path={iconPlus} />
				}
			>
				Create record
			</Button>
		</Drawer>
	);
}
