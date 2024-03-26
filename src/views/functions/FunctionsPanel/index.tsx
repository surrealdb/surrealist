import { Badge, Tooltip, ActionIcon, TextInput, ScrollArea, Stack, Text } from "@mantine/core";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useIsLight } from "~/hooks/theme";
import { iconCopy, iconDelete, iconList, iconPlus, iconSearch } from "~/util/icons";
import { FunctionDefinition } from "~/types";
import { mdiFunction } from "@mdi/js";
import { useInputState } from "@mantine/hooks";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";

export interface FunctionsPanelProps {
	active: string;
	functions: FunctionDefinition[];
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
	onDuplicate: (def: FunctionDefinition) => void;
	onCreate: () => void;
}

export function FunctionsPanel({
	active,
	functions,
	onSelect,
	onDelete,
	onDuplicate,
	onCreate,
}: FunctionsPanelProps) {
	const isLight = useIsLight();
	const { showContextMenu } = useContextMenu();

	const [search, setSearch] = useInputState("");

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return functions.filter((f) => f.name.toLowerCase().includes(needle));
	}, [functions, search]);

	return (
		<ContentPane
			title="Functions"
			icon={iconList}
			w={275}
			style={{ flexShrink: 0 }}
			leftSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					3
				</Badge>
			}
			rightSection={
				<Tooltip label="New function">
					<ActionIcon onClick={onCreate}>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>
			}
		>
			<ScrollArea
				pos="absolute"
				top={0}
				left={12}
				right={12}
				bottom={12}
			>
				<Stack gap="xs" pb="md">
					{functions.length > 0 ? (
						<TextInput
							placeholder="Search functions..."
							leftSection={<Icon path={iconSearch} />}
							value={search}
							onChange={setSearch}
							variant="unstyled"
							autoFocus
						/>
					) : (
						<Text c="slate" ta="center" mt="lg">
							No functions found
						</Text>
					)}

					{search && filtered.length === 0 && (
						<Text c="slate" ta="center" mt="lg">
							No functions matched
						</Text>
					)}

					{filtered.map((f, i) => (
						<Entry
							key={i}
							isActive={f.name === active}
							onClick={() => onSelect(f.name)}
							leftSection={<Icon path={mdiFunction} />}
							onContextMenu={showContextMenu([
								{
									key: 'open',
									title: "Edit function",
									icon: <Icon path={mdiFunction} />,
									onClick: () => onSelect(f.name)
								},
								{
									key: 'duplicate',
									title: "Duplicate function",
									icon: <Icon path={iconCopy} />,
									onClick: () => onDuplicate(f)
								},
								{
									key: 'remove',
									title: "Remove function",
									color: "red",
									icon: <Icon path={iconDelete} />,
									onClick: () => onDelete(f.name)
								}
							])}
						>
							{f.name}
						</Entry>
					))}
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}