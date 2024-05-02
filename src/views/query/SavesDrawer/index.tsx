import classes from "./style.module.scss";

import clsx from "clsx";
import { Accordion, Badge, Button, ScrollArea, Text, TextInput, Tooltip } from "@mantine/core";
import { Drawer, Group, ActionIcon } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useActiveQuery, useSavedQueryTags } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { SavedQuery } from "~/types";
import { useContextMenu } from "mantine-contextmenu";
import { iconClose, iconDelete, iconEdit, iconPlus, iconQuery, iconSearch, iconText } from "~/util/icons";
import { CodePreview } from "~/components/CodePreview";

export interface SavesDrawerProps {
	opened: boolean;
	onClose: () => void;
	onSaveQuery: () => void;
	onEditQuery: (query: SavedQuery) => void;
}

export function SavesDrawer(props: SavesDrawerProps) {
	const { addQueryTab, updateQueryTab, removeSavedQuery } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const queries = useConfigStore((s) => s.savedQueries);
	const activeTab = useActiveQuery();
	const tags = useSavedQueryTags();

	const [filterTag, setFilterTag] = useState<string | null>(null);
	const [filterText, setFilterText] = useInputState("");

	const showTags = tags.length > 0;
	const showAll = filterTag === null;

	const filtered = useMemo(() => {
		const needle = filterText.toLowerCase();

		return queries.filter((entry) =>
			(entry.query.toLowerCase().includes(needle) || entry.name.toLowerCase().includes(needle)) && (!filterTag || entry.tags.includes(filterTag))
		);
	}, [queries, filterText, filterTag]);

	const handleUseQuery = useStable((entry: SavedQuery, e?: React.MouseEvent) => {
		e?.stopPropagation();

		props.onClose();
		addQueryTab({
			query: entry.query,
			name: entry.name
		});
	});

	const handleReplaceQuery = useStable((entry: SavedQuery) => {
		props.onClose();
		updateQueryTab({
			id: activeTab!.id,
			query: entry.query
		});
	});

	const handleDeleteQuery = useStable((entry: SavedQuery) => {
		removeSavedQuery(entry.id);
	});

	useLayoutEffect(() => {
		if (filterTag && !tags.includes(filterTag)) {
			setFilterTag(null);
		}
	}, [tags, filterTag]);

	return (
		<Drawer
			opened={props.opened}
			onClose={props.onClose}
			position="right"
			trapFocus={false}
		>
			<Group mb="md">
				<ModalTitle>Saved queries</ModalTitle>

				<Spacer />

				<Tooltip label="Save current query">
					<ActionIcon
						onClick={props.onSaveQuery}
						aria-label="Save current query"
					>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>

				<ActionIcon
					onClick={props.onClose}
					aria-label="Close saved query drawer"
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
			<TextInput
				autoFocus
				placeholder="Search saved queries..."
				leftSection={<Icon path={iconSearch} />}
				value={filterText}
				onChange={setFilterText}
				mb="sm"
			/>
			{showTags && (
				<ScrollArea
					w="100%"
					scrollbars="x"
					type="scroll"
				>
					<Group gap={6} pb="sm">
						<Button
							size="xs"
							color="slate"
							className={clsx(classes.tag, showAll && classes.tagActive)}
							variant={showAll ? "filled" : "subtle"}
							onClick={() => setFilterTag(null)}
						>
							All queries
						</Button>
						{tags.map((tag, i) => {
							const isActive = tag === filterTag;

							return (
								<Button
									key={i}
									size="xs"
									color="slate"
									className={clsx(classes.tag, isActive && classes.tagActive)}
									variant={isActive ? "filled" : "subtle"}
									onClick={() => setFilterTag(tag)}
								>
									{tag}
								</Button>
							);
						})}
					</Group>
				</ScrollArea>
			)}

			{filtered.length === 0 && (
				<Text ta="center" mt="sm" c="slate">
					No queries to display
				</Text>
			)}

			<Accordion
				styles={{
					content: {
						paddingInline: 0
					},
					label: {
						paddingBlock: 0
					},
					control: {
						paddingLeft: 8
					}
				}}
			>
				{filtered.map((entry, i) => (
					<Accordion.Item
						key={i}
						value={entry.id}
						className={classes.query}
						onContextMenu={showContextMenu([
							{
								key: 'open',
								title: 'Open in new tab',
								icon: <Icon path={iconQuery} />,
								onClick: () => handleUseQuery(entry),
							},
							{
								key: 'replace',
								title: 'Open in current tab',
								icon: <Icon path={iconText} />,
								onClick: () => handleReplaceQuery(entry),
							},
							{
								key: 'edit',
								title: 'Edit query',
								icon: <Icon path={iconEdit} />,
								onClick: () => props.onEditQuery(entry),
							},
							{
								key: 'delete',
								title: 'Delete query',
								color: 'pink.7',
								icon: <Icon path={iconDelete} />,
								onClick: () => handleDeleteQuery(entry),
							}
						])}
					>
						<Accordion.Control>
							<Group gap="sm" mr="md" h={46}>
								<Text
									c="surreal"
									fw={600}
								>
									{entry.name}
								</Text>
								<Spacer />
								<Tooltip label="Open in new tab">
									<ActionIcon
										component="div"
										variant="gradient"
										className={classes.queryAction}
										onClick={e => handleUseQuery(entry, e)}
										aria-label="Open query in new tab"
									>
										<Icon path={iconQuery} size={0.9} />
									</ActionIcon>
								</Tooltip>
							</Group>
						</Accordion.Control>
						<Accordion.Panel p={0} px={4}>
							<CodePreview
								value={entry.query}
							/>
							{entry.tags.length > 0 && (
								<Group mt="sm" gap="xs">
									{entry.tags.map((tag, i) => (
										<Badge
											key={i}
											size="xs"
											color="slate"
											radius="sm"
										>
											{tag}
										</Badge>
									))}
								</Group>
							)}
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Drawer>
	);
}