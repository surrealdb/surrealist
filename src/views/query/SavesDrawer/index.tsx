import classes from "./style.module.scss";

import clsx from "clsx";
import { Accordion, Badge, Button, Paper, ScrollArea, Text, TextInput, Tooltip } from "@mantine/core";
import { Drawer, Group, ActionIcon } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useActiveQuery, useSavedQueryTags } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { SavedQuery } from "~/types";
import { useContextMenu } from "mantine-contextmenu";
import { iconClose, iconDelete, iconEdit, iconPlus, iconQuery, iconSearch, iconText } from "~/util/icons";

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
	const isLight = useIsLight();

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
			withCloseButton={false}
		>
			<Group mb="md">
				<ModalTitle>Saved queries</ModalTitle>

				<Spacer />
				
				<ActionIcon onClick={props.onSaveQuery} title="Add query">
					<Icon path={iconPlus} />
				</ActionIcon>

				<ActionIcon onClick={props.onClose}>
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
								color: 'red',
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
								<Tooltip
									position="top"
									label="Open in new tab"
									offset={10}
									transitionProps={{ transition: "pop" }}
									openDelay={250}
								>
									<ActionIcon
										component="div"
										className={classes.queryAction}
										onClick={e => handleUseQuery(entry, e)}
									>
										<Icon path={iconQuery} size={0.9} />
									</ActionIcon>
								</Tooltip>
								{/* <ActionIcon
									className={classes.queryAction}
									onClick={e => handleDeleteQuery(entry, e)}
								>
									<Icon path={mdiDelete} size={0.9} />
								</ActionIcon> */}
								{/* <ActionIcon
									className={classes.queryAction}
								>
									<Icon path={mdiDotsVertical} size={0.9} />
								</ActionIcon> */}
							</Group>
						</Accordion.Control>
						<Accordion.Panel p={0} px={4}>
							<Paper p="xs" bg={isLight ? 'slate.1' : 'slate.9'}>
								{entry.tags.length > 0 && (
									<Group mb="xs" gap="xs">
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
								<Text
									ff="JetBrains Mono"
									className={classes.queryText}
									lineClamp={8}
									fw={600}
								>
									{entry.query}
								</Text>
							</Paper>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Drawer>
	);
}