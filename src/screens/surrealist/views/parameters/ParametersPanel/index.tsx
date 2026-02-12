import { Badge, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconCopy, iconDelete, iconPlus, iconSearch, iconVariable } from "@surrealdb/ui";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { ContentPane } from "~/components/Pane";
import { useIsConnected } from "~/hooks/connection";
import { useIsLight } from "~/hooks/theme";
import type { SchemaParameter } from "~/types";
import classes from "./style.module.scss";

export interface ParametersPanelProps {
	active: string;
	params: SchemaParameter[];
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
	onDuplicate: (def: SchemaParameter) => void;
	onCreate: () => void;
}

export function ParametersPanel({
	active,
	params,
	onSelect,
	onDelete,
	onDuplicate,
	onCreate,
}: ParametersPanelProps) {
	const isLight = useIsLight();
	const isConnected = useIsConnected();
	const { showContextMenu } = useContextMenu();

	const [search, setSearch] = useInputState("");

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return params.filter((p) => p.name.toLowerCase().includes(needle));
	}, [params, search]);

	return (
		<ContentPane
			title="Parameters"
			icon={iconVariable}
			style={{ flexShrink: 0 }}
			infoSection={
				<Badge
					color={isLight ? "obsidian.0" : "obsidian.9"}
					radius="sm"
					c="inherit"
				>
					{params.length}
				</Badge>
			}
			rightSection={
				<ActionButton
					disabled={!isConnected}
					label="New parameter"
					onClick={onCreate}
				>
					<Icon path={iconPlus} />
				</ActionButton>
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
					{params.length > 0 ? (
						<TextInput
							placeholder="Search parameters..."
							leftSection={<Icon path={iconSearch} />}
							value={search}
							spellCheck={false}
							onChange={setSearch}
							variant="unstyled"
							autoFocus
						/>
					) : (
						<Text
							c="obsidian"
							ta="center"
							mt="lg"
						>
							No parameters found
						</Text>
					)}

					{search && filtered.length === 0 && (
						<Text
							c="obsidian"
							ta="center"
							mt="lg"
						>
							No parameters matched
						</Text>
					)}

					{filtered.map((f, i) => (
						<Entry
							key={i}
							isActive={f.name === active}
							onClick={() => onSelect(f.name)}
							leftSection={<Icon path={iconVariable} />}
							onContextMenu={showContextMenu([
								{
									key: "open",
									title: "Edit parameter",
									icon: <Icon path={iconVariable} />,
									onClick: () => onSelect(f.name),
								},
								{
									key: "duplicate",
									title: "Duplicate parameter",
									icon: <Icon path={iconCopy} />,
									onClick: () => onDuplicate(f),
								},
								{
									key: "remove",
									title: "Remove parameter",
									color: "pink.7",
									icon: <Icon path={iconDelete} />,
									onClick: () => onDelete(f.name),
								},
							])}
						>
							<Text
								style={{
									textOverflow: "ellipsis",
									overflow: "hidden",
								}}
							>
								{f.name}
							</Text>
						</Entry>
					))}
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}
