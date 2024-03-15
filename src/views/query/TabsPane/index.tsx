import classes from "./style.module.scss";
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
import { getSurreal } from "~/util/surreal";
import { iconArrowUpRight, iconChevronRight, iconClose, iconCopy, iconHistory, iconList, iconPlus, iconQuery, iconStar } from "~/util/icons";
import { Entry } from "~/components/Entry";
import { useContextMenu } from "mantine-contextmenu";
import { TabQuery } from "~/types";
import { Sortable } from "~/components/Sortable";
import clsx from "clsx";
import { Spacer } from "~/components/Spacer";

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
		getSurreal()?.cancelQueries(id);
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

	return (
		<ContentPane
			icon={iconList}
			title="Queries"
			w={300}
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
					<ActionIcon onClick={newTab}>
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
				<ScrollArea flex={1}>
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
											}}
										/>
									</Entry>
								);
							}}
						</Sortable>
					</Stack>
				</ScrollArea>
				<Spacer />
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