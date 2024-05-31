import { EditorView } from "@codemirror/view";
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Drawer,
	Group,
	Select,
	SimpleGrid,
	Stack,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { surrealql } from "codemirror-surrealql";
import { useLayoutEffect, useState } from "react";
import { RecordId, Table } from "surrealdb.js";
import { CodeEditor } from "~/components/CodeEditor";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { Label } from "~/components/Scaffold/settings/utilities";
import { Spacer } from "~/components/Spacer";
import { executeQuery } from "~/connection";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useValueValidator } from "~/hooks/surrealql";
import { surqlLinting } from "~/util/editor/extensions";
import { RecordsChangedEvent } from "~/util/global-events";
import { iconClose, iconPlus } from "~/util/icons";

export interface CreatorDrawerProps {
	opened: boolean;
	table: string;
	onClose: () => void;
}

export function CreatorDrawer({ opened, table, onClose }: CreatorDrawerProps) {
	const [recordTable, setRecordTable] = useState("");
	const [recordId, setRecordId] = useInputState("");
	const [recordBody, setRecordBody] = useState("");
	const [isValid, body] = useValueValidator(recordBody);
	const tables = useTableNames();

	const handleSubmit = useStable(async () => {
		if (!isValid) {
			return;
		}

		const id = recordId
			? new RecordId(recordTable, recordId)
			: new Table(recordTable);

		await executeQuery(/* surql */ `CREATE $id CONTENT $body`, { id, body });

		onClose();
		RecordsChangedEvent.dispatch(null);
	});

	const setCursor = useStable((editor: EditorView) => {
		editor.dispatch({ selection: { anchor: 6, head: 6 } });
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: ignoring
	useLayoutEffect(() => {
		if (opened) {
			setRecordTable(table);
			setRecordId("");
			setRecordBody("{\n    \n}");
		}
	}, [opened, table]);

	const [width, setWidth] = useState(650);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size={width}
			styles={{
				body: {
					height: "100%",
					maxHeight: "100%",
					display: "flex",
					flexWrap: "nowrap",
					flexDirection: "column",
					gap: "var(--mantine-spacing-lg)",
				},
			}}
		>
			<DrawerResizer minSize={500} maxSize={900} onResize={setWidth} />

			<Group gap="sm">
				<ModalTitle>
					<Icon left path={iconPlus} size="sm" />
					Create record
				</ModalTitle>

				<Spacer />

				{!isValid && (
					<Badge color="red" variant="light">
						Invalid content
					</Badge>
				)}

				<ActionIcon onClick={onClose} aria-label="Close creator drawer">
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>

			<Stack flex={1} gap={6} style={{ flexShrink: 1, flexBasis: 0 }}>
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
						spellCheck={false}
						onChange={setRecordId}
						placeholder="Leave empty to generate"
					/>
				</SimpleGrid>

				<Label>Contents</Label>

				<Box flex={1} pos="relative">
					<CodeEditor
						pos="absolute"
						inset={0}
						autoFocus
						value={recordBody}
						onChange={setRecordBody}
						extensions={[surrealql(), surqlLinting()]}
						onMount={setCursor}
					/>
				</Box>
			</Stack>

			<Button
				disabled={!isValid}
				variant="gradient"
				onClick={handleSubmit}
				style={{ flexShrink: 0 }}
				rightSection={<Icon path={iconPlus} />}
			>
				Create record
			</Button>
		</Drawer>
	);
}
