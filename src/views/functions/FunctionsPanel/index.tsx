import classes from "./style.module.scss";
import { Badge, Tooltip, ActionIcon, TextInput, ScrollArea, Stack, Text } from "@mantine/core";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useIsLight } from "~/hooks/theme";
import { iconCopy, iconDelete, iconFunction, iconPlus, iconSearch } from "~/util/icons";
import { SchemaFunction } from "~/types";
import { useInputState } from "@mantine/hooks";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";
import { useIsConnected } from "~/hooks/connection";

export interface FunctionsPanelProps {
	active: string;
	functions: SchemaFunction[];
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
	onDuplicate: (def: SchemaFunction) => void;
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
	const isConnected = useIsConnected();
	const { showContextMenu } = useContextMenu();

	const [search, setSearch] = useInputState("");

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return functions.filter((f) => f.name.toLowerCase().includes(needle));
	}, [functions, search]);

	return (
		<ContentPane
			title="Functions"
			icon={iconFunction}
			style={{ flexShrink: 0 }}
			leftSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{functions.length}
				</Badge>
			}
			rightSection={
				<Tooltip label="New function">
					<ActionIcon
						onClick={onCreate}
						aria-label="Create new function"
						disabled={!isConnected}
					>
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
				classNames={{
					viewport: classes.scroller
				}}
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
							leftSection={<Icon path={iconFunction} />}
							onContextMenu={showContextMenu([
								{
									key: 'open',
									title: "Edit function",
									icon: <Icon path={iconFunction} />,
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
									color: "pink.7",
									icon: <Icon path={iconDelete} />,
									onClick: () => onDelete(f.name)
								}
							])}
						>
							<Text
								style={{
									textOverflow: 'ellipsis',
									overflow: 'hidden'
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
