import classes from "./style.module.scss";
import clsx from "clsx";
import { ActionIcon, Badge, Divider, ScrollArea, Stack, Tooltip } from "@mantine/core";
import { EditableText } from "~/components/EditableText";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { LiveIndicator } from "~/components/LiveIndicator";
import { iconArrowUpRight, iconChevronRight, iconClose, iconCopy, iconDelete, iconHistory, iconList, iconPlus, iconQuery, iconStar } from "~/util/icons";
import { Entry } from "~/components/Entry";
import { useContextMenu } from "mantine-contextmenu";
import { TabQuery } from "~/types";
import { Sortable } from "~/components/Sortable";
import { useIntent } from "~/hooks/url";
import { cancelLiveQueries } from "~/connection";

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

export function TabsPane(props: TabsPaneProps) {
	const { updateCurrentConnection, addQueryTab, removeQueryTab, updateQueryTab, setActiveQueryTab } = useConfigStore.getState();
	const { queries, activeQuery } = useActiveConnection();
	const { showContextMenu } = useContextMenu();
	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isLight = useIsLight();

	const newTab = useStable(() => {
		addQueryTab();
	});

	const removeTab = useStable((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeQueryTab(id);
		cancelLiveQueries(id);
	});

	const renameQuery = useStable((id: string, name: string) => {
		updateQueryTab({
			id,
			name
		});
	});

	const saveQueryOrder = useStable((queries: TabQuery[]) => {
		updateCurrentConnection({
			queries
		});
	});

	const duplicateQuery = ({ query, name, variables }: TabQuery) => {
		addQueryTab({
			name: name?.replace(/ \d+$/, ""),
			query,
			variables
		});
	};

	useIntent('new-query', addQueryTab);

	return (
		<ContentPane
			icon={iconList}
			title="Queries"
			style={{ flexShrink: 0 }}
			leftSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{queries.length}
				</Badge>
			}
			rightSection={
				<Tooltip label="New query">
					<ActionIcon
						onClick={newTab}
						aria-label="Create new query"
					>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>
			}
		>
			<Stack
				pos="absolute"
				top={0}
				left={12}
				right={12}
				bottom={12}
				gap={0}
			>
				<ScrollArea
					flex={1}
					classNames={{
						viewport: classes.scroller
					}}
				>
					<Stack gap="xs" pb="md">
						<Sortable
							items={queries}
							direction="vertical"
							constraint={{ distance: 10 }}
							onSorted={saveQueryOrder}
						>
							{({ item: query, handleProps, isDragging }) => {
								const isActive = query.id === activeQuery;
								const isLive = liveTabs.has(query.id);

								return (
									<Entry
										key={query.id}
										isActive={isActive}
										onClick={() => setActiveQueryTab(query.id)}
										className={clsx(classes.query, isDragging && classes.queryDragging)}
										onContextMenu={showContextMenu([
											{
												key: "open",
												title: "Open query",
												icon: <Icon path={iconArrowUpRight} />,
												onClick: () => setActiveQueryTab(query.id)
											},
											{
												key: "duplicate",
												title: "Duplicate query",
												icon: <Icon path={iconCopy} />,
												onClick: () => duplicateQuery(query)
											},
											{
												key: "delete",
												title: "Delete query",
												color: "pink.7",
												icon: <Icon path={iconDelete} />,
												onClick: (e) => removeTab(query.id, e)
											}
										])}
										leftSection={
											<Icon path={iconQuery} />
										}
										rightSection={
											<>
												{isLive && (
													<LiveIndicator
														className={classes.queryLive}
														mr={-4}
													/>
												)}

												{queries.length > 1 && (
													<ActionIcon
														size="sm"
														component="div"
														variant="subtle"
														className={classes.queryClose}
														onClick={(e) => removeTab(query.id, e)}
														color={(isActive && isLight) ? "white" : undefined}
														aria-label="Close query tab"
													>
														<Icon path={iconClose} size="sm" />
													</ActionIcon>
												)}
											</>
										}
										{...handleProps}
									>
										<EditableText
											value={query.name || ''}
											onChange={(value) => renameQuery(query.id, value)}
											withDoubleClick
											withDecoration
											style={{
												outline: 'none',
												textOverflow: 'ellipsis',
												overflow: 'hidden'
											}}
										/>
									</Entry>
								);
							}}
						</Sortable>
					</Stack>
				</ScrollArea>
				<Divider my="xs" />
				<Entry
					leftSection={<Icon path={iconStar} />}
					rightSection={<Icon path={iconChevronRight} />}
					onClick={props.openSaved}
				>
					Saved queries
				</Entry>
				<Entry
					leftSection={<Icon path={iconHistory} />}
					rightSection={<Icon path={iconChevronRight} />}
					onClick={props.openHistory}
				>
					Query history
				</Entry>
			</Stack>
		</ContentPane>
	);
}