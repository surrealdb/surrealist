import {
	Badge,
	type BoxProps,
	Divider,
	type ElementProps,
	Menu,
	ScrollArea,
	Stack,
} from "@mantine/core";
import clsx from "clsx";
import { useContextMenu } from "mantine-contextmenu";
import { useState } from "react";
import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { ActionButton } from "~/components/ActionButton";
import { EditableText } from "~/components/EditableText";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { LiveIndicator } from "~/components/LiveIndicator";
import { ContentPane } from "~/components/Pane";
import { Sortable } from "~/components/Sortable";
import { useSetting } from "~/hooks/config";
import { useConnection } from "~/hooks/connection";
import { useConnectionAndView, useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { cancelLiveQueries } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type { QueryFolder, QueryTab, QueryType } from "~/types";
import { uniqueName } from "~/util/helpers";
import {
	iconArrowLeft,
	iconArrowUpRight,
	iconChevronLeft,
	iconChevronRight,
	iconClose,
	iconCopy,
	iconDotsHorizontal,
	iconFile,
	iconFolder,
	iconFolderPlus,
	iconHistory,
	iconHome,
	iconList,
	iconPlus,
	iconQuery,
	iconSearch,
	iconStar,
	iconText,
} from "~/util/icons";
import classes from "./style.module.scss";

const TYPE_ICONS: Record<QueryType, string> = {
	config: iconQuery,
	file: iconFile,
};

interface QueryProps extends BoxProps, ElementProps<"button"> {
	query: QueryTab;
	queries: QueryTab[];
	isActive: boolean;
	isLive: boolean;
	isDragging: boolean;
	onActivate: (id: string) => void;
	onRemoveQuery: (id: string) => void;
}

function Query({
	query,
	queries,
	isActive,
	isLive,
	isDragging,
	onActivate,
	onRemoveQuery,
	...other
}: QueryProps) {
	const { addQueryTab, updateQueryTab } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const [isRenaming, setIsRenaming] = useState(false);
	const [queryQuickClose] = useSetting("behavior", "queryQuickClose");
	const [connection] = useConnectionAndView();
	const isLight = useIsLight();

	const explorerName = adapter.platform === "darwin" ? "Finder" : "Explorer";

	const handleActivate = useStable(() => {
		onActivate(query.id);
	});

	const removeOthers = useStable((id: string, dir: number) => {
		const index = queries.findIndex((q) => q.id === id);

		for (const [i, query] of queries.entries()) {
			if (
				query.id !== id &&
				(dir === 0 || (dir === -1 && i < index) || (dir === 1 && i > index))
			) {
				onRemoveQuery(query.id);
			}
		}
	});

	const renameQuery = useStable((id: string, newName: string) => {
		if (!connection) return;

		const existing = queries.filter((q) => q.id !== id).map((q) => q.name ?? "");
		const name = uniqueName(newName || "New query", existing);

		updateQueryTab(connection, {
			id,
			name,
		});
	});

	const handleQuickRemove = useStable((e: React.MouseEvent) => {
		e.stopPropagation();
		onRemoveQuery(query.id);
	});

	const buildContextMenu = showContextMenu([
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: handleActivate,
		},
		{
			key: "duplicate",
			title: "Duplicate",
			icon: <Icon path={iconCopy} />,
			onClick: () => {
				if (!connection) return;

				addQueryTab(connection, {
					type: "config",
					name: query.name?.replace(/ \d+$/, ""),
					query: query.query,
					variables: query.variables,
				});
			},
		},
		{
			key: "rename",
			title: "Rename",
			icon: <Icon path={iconText} />,
			onClick: () => setIsRenaming(true),
		},
		{
			hidden: query.type !== "file",
			key: "open-in-explorer",
			title: `Reveal in ${explorerName}`,
			icon: <Icon path={iconSearch} />,
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
			onClick: () => onRemoveQuery(query.id),
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
			disabled: queries.length === 1 || queries.findIndex((q) => q.id === query.id) === 0,
			onClick: () => removeOthers(query.id, -1),
		},
		{
			key: "close-after",
			title: "Close queries After",
			disabled:
				queries.length === 1 ||
				queries.findIndex((q) => q.id === query.id) >= queries.length - 1,
			onClick: () => removeOthers(query.id, 1),
		},
	]);

	return (
		<Entry
			key={query.id}
			isActive={isActive}
			onClick={handleActivate}
			className={clsx(classes.query, isDragging && classes.queryDragging)}
			onContextMenu={buildContextMenu}
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

					{queryQuickClose && (
						<ActionButton
							size="sm"
							variant="transparent"
							component="div"
							className={classes.queryClose}
							onClick={handleQuickRemove}
							color={isActive && isLight ? "white" : undefined}
							label="Close query"
						>
							<Icon
								path={iconClose}
								size="sm"
							/>
						</ActionButton>
					)}
				</>
			}
			{...other}
		>
			<EditableText
				value={query.name || ""}
				onChange={(value) => renameQuery(query.id, value)}
				activationMode="double-click"
				editable={isRenaming}
				onEditableChange={setIsRenaming}
				withDecoration
				style={{
					outline: "none",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			/>
		</Entry>
	);
}

interface FolderProps extends BoxProps, ElementProps<"button"> {
	folder: QueryFolder;
	folders: QueryFolder[];
	onNavigate: (folderId: string) => void;
	onRemoveFolder: (folderId: string) => void;
}

function Folder({ folder, folders, onNavigate, onRemoveFolder, ...other }: FolderProps) {
	const { updateQueryFolder } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const [isRenaming, setIsRenaming] = useState(false);
	const [connection] = useConnectionAndView();

	const handleNavigate = useStable(() => {
		onNavigate(folder.id);
	});

	const renameFolder = useStable((id: string, newName: string) => {
		if (!connection) return;

		const existing = folders.filter((f) => f.id !== id).map((f) => f.name);
		const name = uniqueName(newName || "New folder", existing);

		updateQueryFolder(connection, {
			id,
			name,
		});
	});

	const buildContextMenu = showContextMenu([
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: handleNavigate,
		},
		{
			key: "rename",
			title: "Rename",
			icon: <Icon path={iconText} />,
			onClick: () => setIsRenaming(true),
		},
		{
			key: "delete",
			title: "Delete",
			onClick: () => onRemoveFolder(folder.id),
		},
	]);

	return (
		<Entry
			key={folder.id}
			onClick={isRenaming ? undefined : handleNavigate}
			onContextMenu={buildContextMenu}
			leftSection={<Icon path={iconFolder} />}
			rightSection={<Icon path={iconChevronRight} />}
			{...other}
		>
			<EditableText
				value={folder.name}
				onChange={(value) => renameFolder(folder.id, value)}
				activationMode="double-click"
				editable={isRenaming}
				onEditableChange={setIsRenaming}
				withDecoration
				style={{
					outline: "none",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			/>
		</Entry>
	);
}

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

export function TabsPane(props: TabsPaneProps) {
	const { removeQueryState } = useQueryStore.getState();
	const {
		updateConnection,
		addQueryTab,
		removeQueryTab,
		updateQueryTab,
		setActiveQueryTab,
		addQueryFolder,
		removeQueryFolder,
		updateQueryFolder,
		navigateToFolder,
		navigateToParentFolder,
		navigateToRoot,
	} = useConfigStore.getState();

	const [connection] = useConnectionAndView();
	const [activeQuery, queries, queryFolders, currentFolderPath] = useConnection((c) => [
		c?.activeQuery ?? "",
		c?.queries ?? [],
		c?.queryFolders ?? [],
		c?.currentFolderPath ?? [],
	]);
	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isLight = useIsLight();

	const newTab = useStable(() => {
		if (!connection) return;

		addQueryTab(connection, { type: "config" });
	});

	const newFolder = useStable(() => {
		if (!connection) return;

		addQueryFolder(connection, "New folder");
	});

	const handleNavigateToFolder = useStable((folderId: string) => {
		if (!connection) return;

		navigateToFolder(connection, folderId);
	});

	const handleNavigateBack = useStable(() => {
		if (!connection) return;

		navigateToParentFolder(connection);
	});

	const handleNavigateToRoot = useStable(() => {
		if (!connection) return;

		navigateToRoot(connection);
	});

	const removeTab = useStable((id: string) => {
		if (!connection) return;

		removeQueryTab(connection, id);
		cancelLiveQueries(id);
		removeQueryState(id);

		if (adapter instanceof DesktopAdapter) {
			adapter.pruneQueryFiles();
		}

		if (queries.length === 1) {
			newTab();
		}
	});

	const removeFolder = useStable((id: string) => {
		if (!connection) return;

		removeQueryFolder(connection, id);
	});

	const saveItemOrder = useStable((items: (QueryTab | QueryFolder)[]) => {
		if (!connection) return;

		// Update order property for each item
		items.forEach((item, index) => {
			if ("parentId" in item) {
				// It's a QueryFolder - update its order
				updateQueryFolder(connection, {
					id: item.id,
					order: index,
				});
			} else {
				// It's a QueryTab - update its order
				updateQueryTab(connection, {
					id: item.id,
					order: index,
				});
			}
		});
	});

	const closeQueryList = useStable(() => {
		if (!connection) return;

		updateConnection({
			id: connection,
			queryTabList: false,
		});
	});

	const handleActivate = useStable((id: string) => {
		if (!connection) return;

		setActiveQueryTab(connection, id);
	});

	// Get current folder ID (last in path) or undefined for root
	const currentFolderId =
		currentFolderPath.length > 0 ? currentFolderPath[currentFolderPath.length - 1] : undefined;

	// Filter queries and folders for current context
	const currentQueries = queries
		.filter((query) => query.folderId === currentFolderId)
		.sort((a, b) => a.order - b.order);
	const currentFolders = queryFolders
		.filter((folder) => folder.parentId === currentFolderId)
		.sort((a, b) => a.order - b.order);

	// Combine folders and queries for sortable list, sorted by order
	const sortableItems: (QueryFolder | QueryTab)[] = [...currentFolders, ...currentQueries].sort(
		(a, b) => a.order - b.order,
	);

	// Build breadcrumb path
	const breadcrumbPath = currentFolderPath.map((folderId) => {
		const folder = queryFolders.find((f) => f.id === folderId);
		return { id: folderId, name: folder?.name || "Unknown" };
	});

	// Truncate breadcrumb path - show max 2 folders + ellipsis
	const MAX_VISIBLE_FOLDERS = 2;
	const shouldTruncate = breadcrumbPath.length > MAX_VISIBLE_FOLDERS;

	let visibleBreadcrumbs = breadcrumbPath;
	let hiddenBreadcrumbs: typeof breadcrumbPath = [];

	if (shouldTruncate) {
		// Show first folder + ellipsis + last folder
		const firstItem = breadcrumbPath.slice(0, 1);
		const lastItem = breadcrumbPath.slice(-1);
		hiddenBreadcrumbs = breadcrumbPath.slice(1, -1);
		visibleBreadcrumbs = [...firstItem, ...lastItem];
	}

	// Total count for badge - only count queries, not folders
	const totalCount = currentQueries.length;

	useIntent("new-query", newTab);

	useIntent("close-query", () => {
		if (activeQuery) {
			removeTab(activeQuery);
		}
	});

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
					{totalCount}
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
						label="New folder"
						onClick={newFolder}
					>
						<Icon path={iconFolderPlus} />
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
				{/* Navigation breadcrumb */}
				{currentFolderPath.length > 0 && (
					<div className={classes.breadcrumbContainer}>
						<div className={classes.breadcrumbButtons}>
							<ActionButton
								label="Back"
								onClick={handleNavigateBack}
							>
								<Icon path={iconArrowLeft} />
							</ActionButton>

							<ActionButton
								label="Navigate to root"
								onClick={handleNavigateToRoot}
							>
								<Icon path={iconHome} />
							</ActionButton>
						</div>

						<div className={classes.breadcrumbNav}>
							{shouldTruncate ? (
								<>
									{/* First folder */}
									{visibleBreadcrumbs.slice(0, 1).map((item, index) => (
										<span key={`first-${item.id}`}>
											<button
												type="button"
												className={classes.breadcrumbLink}
												onClick={() => {
													if (!connection) return;
													const newPath = currentFolderPath.slice(
														0,
														index + 1,
													);
													updateConnection({
														id: connection,
														currentFolderPath: newPath,
													});
												}}
												title={`Navigate to ${item.name}`}
											>
												{item.name}
											</button>
										</span>
									))}

									{/* Ellipsis menu for hidden items */}
									{hiddenBreadcrumbs.length > 0 && (
										<span>
											<span className={classes.breadcrumbSeparator}>/</span>
											<Menu
												shadow="md"
												width={200}
											>
												<Menu.Target>
													<button
														type="button"
														className={classes.breadcrumbLink}
														title="Show hidden folders"
													>
														<Icon
															path={iconDotsHorizontal}
															size="sm"
														/>
													</button>
												</Menu.Target>
												<Menu.Dropdown>
													{hiddenBreadcrumbs.map((item, hiddenIndex) => (
														<Menu.Item
															key={item.id}
															leftSection={
																<Icon
																	path={iconFolder}
																	size="sm"
																/>
															}
															onClick={() => {
																if (!connection) return;
																const actualIndex =
																	1 + hiddenIndex + 1; // 1 (first item) + hiddenIndex + 1 (to include clicked item)
																const newPath =
																	currentFolderPath.slice(
																		0,
																		actualIndex,
																	);
																updateConnection({
																	id: connection,
																	currentFolderPath: newPath,
																});
															}}
														>
															{item.name}
														</Menu.Item>
													))}
												</Menu.Dropdown>
											</Menu>
										</span>
									)}

									{/* Last folder */}
									{visibleBreadcrumbs.slice(1).map((item) => {
										const actualIndex = breadcrumbPath.length;
										return (
											<span key={`last-${item.id}`}>
												<span className={classes.breadcrumbSeparator}>
													/
												</span>
												<button
													type="button"
													className={classes.breadcrumbLink}
													onClick={() => {
														if (!connection) return;
														const newPath = currentFolderPath.slice(
															0,
															actualIndex,
														);
														updateConnection({
															id: connection,
															currentFolderPath: newPath,
														});
													}}
													title={`Navigate to ${item.name}`}
												>
													{item.name}
												</button>
											</span>
										);
									})}
								</>
							) : (
								/* No truncation needed - show all items */
								breadcrumbPath.map((item, index) => (
									<span key={item.id}>
										{index > 0 && (
											<span className={classes.breadcrumbSeparator}>/</span>
										)}
										<button
											type="button"
											className={classes.breadcrumbLink}
											onClick={() => {
												if (!connection) return;
												const newPath = currentFolderPath.slice(
													0,
													index + 1,
												);
												updateConnection({
													id: connection,
													currentFolderPath: newPath,
												});
											}}
											title={`Navigate to ${item.name}`}
										>
											{item.name}
										</button>
									</span>
								))
							)}
						</div>
					</div>
				)}

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
						{sortableItems.length > 0 ? (
							<Sortable
								items={sortableItems}
								direction="vertical"
								constraint={{ distance: 10 }}
								onSorted={saveItemOrder}
							>
								{({ item, handleProps, isDragging }) => {
									// Check if item is a folder
									if ("parentId" in item) {
										const folder = item as QueryFolder;
										return (
											<Folder
												key={folder.id}
												folder={folder}
												folders={currentFolders}
												onNavigate={handleNavigateToFolder}
												onRemoveFolder={removeFolder}
												{...handleProps}
											/>
										);
									} else {
										// Item is a query
										const query = item as QueryTab;
										const isActive = query.id === activeQuery;
										const isLive = liveTabs.has(query.id);

										return (
											<Query
												key={query.id}
												query={query}
												queries={currentQueries}
												isActive={isActive}
												isLive={isLive}
												isDragging={isDragging}
												onActivate={handleActivate}
												onRemoveQuery={removeTab}
												{...handleProps}
											/>
										);
									}
								}}
							</Sortable>
						) : (
							<div style={{ textAlign: "center", padding: "2rem", color: "gray" }}>
								{currentFolderPath.length > 0
									? "This folder is empty"
									: "No queries or folders"}
							</div>
						)}
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
