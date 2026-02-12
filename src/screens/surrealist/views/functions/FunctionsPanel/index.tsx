import { Badge, Group, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	Icon,
	iconCopy,
	iconDelete,
	iconDownload,
	iconFunction,
	iconModuleML,
	iconPlus,
	iconSearch,
	iconUpload,
} from "@surrealdb/ui";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { ContentPane } from "~/components/Pane";
import { useIsConnected } from "~/hooks/connection";
import { useIsLight } from "~/hooks/theme";
import type { FunctionDetails, SchemaModel } from "~/types";
import classes from "./style.module.scss";

export interface FunctionsPanelProps {
	active: string;
	functions: FunctionDetails[];
	onSelect: (func: FunctionDetails) => void;
	onImport: () => void;
	onDownload: (model: SchemaModel) => void;
	onDelete: (func: FunctionDetails) => void;
	onDuplicate: (det: FunctionDetails) => void;
	onCreate: () => void;
}

export function FunctionsPanel({
	active,
	functions,
	onSelect,
	onDelete,
	onImport,
	onDownload,
	onDuplicate,
	onCreate,
}: FunctionsPanelProps) {
	const isLight = useIsLight();
	const isConnected = useIsConnected();
	const { showContextMenu } = useContextMenu();

	const [search, setSearch] = useInputState("");

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return functions.filter((f) => f.details.name.toLowerCase().includes(needle));
	}, [functions, search]);

	return (
		<ContentPane
			title="Functions"
			icon={iconFunction}
			style={{ flexShrink: 0 }}
			infoSection={
				<Badge
					color={isLight ? "obsidian.0" : "obsidian.9"}
					radius="sm"
					c="inherit"
				>
					{functions.length}
				</Badge>
			}
			rightSection={
				<Group>
					<ActionButton
						disabled={!isConnected}
						label="Import model"
						onClick={onImport}
					>
						<Icon path={iconUpload} />
					</ActionButton>
					<ActionButton
						disabled={!isConnected}
						label="New function"
						onClick={onCreate}
					>
						<Icon path={iconPlus} />
					</ActionButton>
				</Group>
			}
		>
			<ScrollArea
				pos="absolute"
				top={0}
				left={12}
				right={12}
				bottom={12}
				classNames={{
					viewport: classes.scroller,
				}}
			>
				<Stack
					gap="xs"
					pb="md"
				>
					{functions.length > 0 && (
						<TextInput
							placeholder="Search functions..."
							leftSection={<Icon path={iconSearch} />}
							value={search}
							spellCheck={false}
							onChange={setSearch}
							variant="unstyled"
							autoFocus
						/>
					)}

					<Stack gap="sm">
						{filtered.length === 0 && (
							<Text
								c="obsidian"
								ta="center"
								mt="lg"
							>
								No functions {search ? "matched" : "defined"}
							</Text>
						)}
						{filtered.map((f, i) => {
							if (f.type === "model") {
								const mod = f.details as SchemaModel;

								return (
									<Entry
										key={i}
										isActive={mod.name === active}
										onClick={() => onSelect(f)}
										leftSection={<Icon path={iconModuleML} />}
										onContextMenu={showContextMenu([
											{
												key: "open",
												title: "Download model",
												icon: <Icon path={iconDownload} />,
												onClick: () => onDownload(mod),
											},
										])}
									>
										<Text
											style={{
												textOverflow: "ellipsis",
												overflow: "hidden",
											}}
										>
											{mod.name}
										</Text>
									</Entry>
								);
							}

							return (
								<Entry
									key={i}
									isActive={f.details.name === active}
									onClick={() => onSelect(f)}
									leftSection={<Icon path={iconFunction} />}
									onContextMenu={showContextMenu([
										{
											key: "open",
											title: "Edit function",
											icon: <Icon path={iconFunction} />,
											onClick: () => onSelect(f),
										},
										{
											key: "duplicate",
											title: "Duplicate function",
											icon: <Icon path={iconCopy} />,
											onClick: () => onDuplicate(f),
										},
										{
											key: "remove",
											title: "Remove function",
											color: "pink.7",
											icon: <Icon path={iconDelete} />,
											onClick: () => onDelete(f),
										},
									])}
								>
									<Text
										style={{
											textOverflow: "ellipsis",
											overflow: "hidden",
										}}
									>
										{f.details.name}
									</Text>
								</Entry>
							);
						})}
					</Stack>
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}
