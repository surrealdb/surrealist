import {
	iconArrowUpRight,
	iconChevronLeft,
	iconChevronRight,
	iconClose,
	iconCopy,
	iconExitToAp,
	iconFile,
	iconHistory,
	iconList,
	iconPlus,
	iconQuery,
	iconStar,
} from "~/util/icons";

import { ActionIcon, Badge, Divider, ScrollArea, Stack, Tooltip } from "@mantine/core";
import clsx from "clsx";
import { useContextMenu } from "mantine-contextmenu";
import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { ActionButton } from "~/components/ActionButton";
import { EditableText } from "~/components/EditableText";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { LiveIndicator } from "~/components/LiveIndicator";
import { ContentPane } from "~/components/Pane";
import { Sortable } from "~/components/Sortable";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useIntent } from "~/hooks/url";
import { cancelLiveQueries } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type { QueryTab, QueryType } from "~/types";
import classes from "./style.module.scss";

const TYPE_ICONS: Record<QueryType, string> = {
	config: iconQuery,
	file: iconFile,
};

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

export function TabsPane(props: TabsPaneProps) {
	const {
		updateCurrentConnection,
		addQueryTab,
		removeQueryTab,
		updateQueryTab,
		setActiveQueryTab,
	} = useConfigStore.getState();

	const { queries, activeQuery } = useActiveConnection();
	const { showContextMenu } = useContextMenu();
	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isLight = useIsLight();

	const newTab = useStable(() => {
		addQueryTab({ type: "config" });
	});

	const removeTab = useStable((id: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		removeQueryTab(id);
		cancelLiveQueries(id);

		if (adapter instanceof DesktopAdapter) {
			adapter.pruneQueryFiles();
		}
	});

	const removeOthers = useStable((id: string, dir: number) => {
		const index = queries.findIndex((q) => q.id === id);

		for (const [i, query] of queries.entries()) {
			if (
				query.id !== id &&
				(dir === 0 || (dir === -1 && i < index) || (dir === 1 && i > index))
			) {
				removeTab(query.id);
			}
		}
	});

	const renameQuery = useStable((id: string, name: string) => {
		updateQueryTab({
			id,
			name,
		});
	});

	const saveQueryOrder = useStable((queries: QueryTab[]) => {
		updateCurrentConnection({
			queries,
		});
	});

	const closeQueryList = useStable(() => {
		updateCurrentConnection({
			queryTabList: false,
		});
	});

	const duplicateQuery = ({ query, name, variables }: QueryTab) => {
		addQueryTab({
			type: "config",
			name: name?.replace(/ \d+$/, ""),
			query,
			variables,
		});
	};

	useIntent("new-query", newTab);

	return (
		<ContentPane
			icon={iconList}
			title="Queries"
			style={{ flexShrink: 0 }}
			infoSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{queries.length}
				</Badge>
			}
			rightSection={
				<>
					<ActionButton
						label="Hide queries"
						onClick={closeQueryList}
					>
						<Icon path={iconChevronLeft} />
					</ActionButton>
					<ActionButton
						label="New query"
						onClick={newTab}
					>
						<Icon path={iconPlus} />
					</ActionButton>
				</>
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
						viewport: classes.scroller,
					}}
				>
					<Stack
						gap="xs"
						pb="md"
					>
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
										className={clsx(
											classes.query,
											isDragging && classes.queryDragging,
										)}
										onContextMenu={showContextMenu([
											{
												key: "open",
												title: "Open",
												icon: <Icon path={iconArrowUpRight} />,
												onClick: () => setActiveQueryTab(query.id),
											},
											{
												key: "duplicate",
												title: "Duplicate",
												icon: <Icon path={iconCopy} />,
												onClick: () => duplicateQuery(query),
											},
											{
												hidden: query.type !== "file",
												key: "open-in-explorer",
												title: "Open in explorer",
												icon: <Icon path={iconExitToAp} />,
												onClick: () => {
													if (adapter instanceof DesktopAdapter) {
														adapter.openInExplorer(query);
													}
												},
											},
											{
												key: "close-div",
											},
											{
												key: "close",
												title: "Close",
												disabled: queries.length === 1,
												onClick: () => removeTab(query.id),
											},
											{
												key: "close-others",
												title: "Close Others",
												disabled: queries.length === 1,
												onClick: () => removeOthers(query.id, 0),
											},
											{
												key: "close-before",
												title: "Close queries Before",
												disabled:
													queries.length === 1 ||
													queries.findIndex((q) => q.id === query.id) ===
													0,
												onClick: () => removeOthers(query.id, -1),
											},
											{
												key: "close-after",
												title: "Close queries After",
												disabled:
													queries.length === 1 ||
													queries.findIndex((q) => q.id === query.id) >=
													queries.length - 1,
												onClick: () => removeOthers(query.id, 1),
											},
										])}
										leftSection={<Icon path={TYPE_ICONS[query.type]} />}
										rightSection={
											<>
												{isLive && (
													<LiveIndicator
														className={classes.queryLive}
														color={isActive ? "white" : "red"}
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
														color={
															isActive && isLight
																? "white"
																: undefined
														}
														aria-label="Close query tab"
													>
														<Icon
															path={iconClose}
															size="sm"
														/>
													</ActionIcon>
												)}
											</>
										}
										{...handleProps}
									>
										<EditableText
											value={query.name || ""}
											onChange={(value) => renameQuery(query.id, value)}
											withDoubleClick
											withDecoration
											style={{
												outline: "none",
												textOverflow: "ellipsis",
												overflow: "hidden",
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
