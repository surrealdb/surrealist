import classes from "./style.module.scss";
import { ActionIcon, Button, Group, Modal, Popover, Stack, TextInput, TextInputProps } from "@mantine/core";
import { ChangeEvent, useState } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ModalTitle } from "~/components/ModalTitle";
import { TableDefinition } from "~/types";
import { useTables } from "~/hooks/schema";
import { iconCancel, iconCheck, iconTable, iconWrench } from "~/util/icons";

export interface QueryInputProps extends TextInputProps {
	onChangeText?: (value: string) => void;
}

export function QueryInput(props: QueryInputProps) {
	const { onChangeText, ...rest } = props;
	const isLight = useIsLight();

	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [editorText, setEditorText] = useState<string | undefined>();

	const openEditor = useStable(() => {
		setIsEditorOpen(true);
		setEditorText((props.value as string) || "");
	});

	const closeEditor = useStable(() => {
		setIsEditorOpen(false);
	});

	const saveEditor = useStable(() => {
		if (onChangeText) {
			onChangeText(editorText || "");
		}

		closeEditor();
	});

	const propagateChange = useStable((e: ChangeEvent<HTMLInputElement>) => {
		if (onChangeText) {
			onChangeText(e.target.value);
		}
	});

	return (
		<>
			<TextInput
				label="Query input"
				rightSectionWidth={44}
				{...rest}
				className={classes.input}
				onChange={propagateChange}
				rightSection={
					<Group gap={8} wrap="nowrap">
						{props.rightSection}
						<ActionIcon title="Advanced editor" onClick={openEditor} color="slate">
							<Icon path={iconWrench} size="sm" color="slate" />
						</ActionIcon>
					</Group>
				}
			/>

			<Modal
				opened={isEditorOpen}
				onClose={closeEditor}
				trapFocus={false}
				size="xl"
				title={<ModalTitle>SurrealQL Editor</ModalTitle>}
			>
				<SurrealistEditor
					language="surrealql"
					value={editorText}
					onChange={setEditorText}
					noExpand
					height={250}
					options={{
						wrappingStrategy: "advanced",
						wordWrap: "on",
						suggest: {
							showProperties: false,
						},
					}}
				/>
				<Group mt="lg">
					<Button
						onClick={closeEditor}
						variant="light"
						color="slate"
					>
						Discard
					</Button>
					<Spacer />
					<Button
						variant="gradient"
						onClick={saveEditor}
						type="submit"
					>
						Done
					</Button>
				</Group>
			</Modal>
		</>
	);
}

export interface PermissionInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function PermissionInput(props: PermissionInputProps) {
	return (
		<QueryInput
			required
			placeholder="WHERE (user = $auth.id)"
			label={props.label}
			value={props.value}
			onChangeText={(value) => props.onChange(value)}
			rightSectionWidth={114}
			rightSection={
				<>
					<ActionIcon
						color="green.4"
						title="Grant full access"
						onClick={() => props.onChange("FULL")}
						variant={props.value.toUpperCase() === "FULL" ? "light" : "subtle"}
					>
						<Icon path={iconCheck} />
					</ActionIcon>
					<ActionIcon
						color="red.5"
						title="Reject all access"
						onClick={() => props.onChange("NONE")}
						variant={props.value.toUpperCase() === "NONE" ? "light" : "subtle"}
					>
						<Icon path={iconCancel} />
					</ActionIcon>
				</>
			}
		/>
	);
}

export interface FieldKindInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function FieldKindInput(props: FieldKindInputProps) {
	const [showTables, setShowTables] = useState(false);
	const tables = useTables();

	const hideTables = useStable(() => {
		setShowTables(false);
	});

	const toggleTables = useStable(() => {
		setShowTables((prev) => !prev);
	});

	const insert = useStable((table: TableDefinition) => {
		props.onChange(`record(${table.schema.name})`);
		hideTables();
	});

	return (
		<TextInput
			required
			placeholder="any"
			label={props.label}
			value={props.value}
			className={classes.input}
			onChange={(value) => props.onChange(value.currentTarget.value)}
			rightSectionWidth={42}
			rightSection={
				<Popover
					position="bottom"
					withinPortal
					opened={showTables}
					onClose={hideTables}
				>
					<Popover.Target>
						<ActionIcon
							title="Select a table"
							onClick={toggleTables}
							variant="subtle"
						>
							<Icon path={iconTable} />
						</ActionIcon>
					</Popover.Target>
					<Popover.Dropdown p={0}>
						<Stack
							mah={300}
							style={{ overflowY: 'auto' }}
							gap="xs"
							p="xs"
						>
							{tables.map((table) => (
								<Button
									style={{ flexShrink: 0 }}
									onClick={() => insert(table)}
									variant="light"
									miw={150}
								>
									{table.schema.name}
								</Button>
							))}
						</Stack>
					</Popover.Dropdown>
				</Popover>
			}
		/>
	);
}