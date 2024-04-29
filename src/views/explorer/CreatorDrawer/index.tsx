import { ActionIcon, Badge, Button, Drawer, Group, Paper, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { CodeEditor } from "~/components/CodeEditor";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus } from "~/util/icons";
import { RecordsChangedEvent } from "~/util/global-events";
import { useTableNames } from "~/hooks/schema";
import { Label } from "~/components/Scaffold/settings/utilities";
import { executeQuery } from "~/connection";
import { RecordId, Table } from "surrealdb.js";
import { surqlLinting } from "~/util/editor/extensions";
import { surrealql } from "codemirror-surrealql";
import { EditorView } from "@codemirror/view";
import { useValueValidator } from "~/hooks/surrealql";

export interface CreatorDrawerProps {
	opened: boolean;
	table: string;
	onClose: () => void;
}

export function CreatorDrawer({ opened, table, onClose }: CreatorDrawerProps) {
	const [recordTable, setRecordTable] = useState('');
	const [recordId, setRecordId] = useInputState('');
	const [recordBody, setRecordBody] = useState('');
	const [isValid, content] = useValueValidator(recordBody);
	const tables = useTableNames();

	const handleSubmit = useStable(async () => {
		if (!isValid) {
			return;
		}

		const id = recordId
			? new RecordId(recordTable, recordId)
			: new Table(recordTable);

		await executeQuery(/* surql */ `CREATE $id CONTENT $content`, {
			id,
			content
		});

		onClose();
		RecordsChangedEvent.dispatch(null);
	});

	const setCursor = useStable((editor: EditorView) => {
		editor.dispatch({selection: {anchor: 6, head: 6}});
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

				{!isValid && (
					<Badge
						color="red"
						variant="light"
					>
						Invalid content
					</Badge>
				)}

				<ActionIcon
					onClick={onClose}
					aria-label="Close creator drawer"
				>
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
						label="Id"
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
						<CodeEditor
							autoFocus
							value={recordBody}
							onChange={setRecordBody}
							extensions={[
								surrealql(),
								surqlLinting()
							]}
							onMount={setCursor}
						/>
					</Paper>
				</Stack>
			</Stack>

			<Button
				disabled={!isValid}
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
