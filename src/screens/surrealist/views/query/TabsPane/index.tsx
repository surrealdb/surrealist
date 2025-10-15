import {
	Badge,
	type BoxProps,
	Center,
	Divider,
	type ElementProps,
	Group,
	Menu,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import clsx from "clsx";
import { useContextMenu } from "mantine-contextmenu";
import { memo, useMemo } from "react";
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
import { openDeleteFolderModal } from "~/modals/delete-folder";
import { cancelLiveQueries } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type { QueryFolder, QueryTab } from "~/types";
import { sortItemsByTimestamp } from "~/util/helpers";
import {
	iconArrowLeft,
	iconChevronLeft,
	iconChevronRight,
	iconClose,
	iconDotsHorizontal,
	iconFolder,
	iconFolderPlus,
	iconHistory,
	iconHome,
	iconList,
	iconPlus,
	iconStar,
} from "~/util/icons";
import {
	buildBreadcrumbPath,
	buildFolderContentDescription,
	buildFolderContextMenuItems,
	buildQueryContextMenuItems,
	buildTabsPaneContextMenuItems,
	executeAllQueriesInFolder,
	getFolderContents,
	removeOthers,
	TYPE_ICONS,
	truncateBreadcrumbPath,
} from "./helpers";
import {
	useCloseQueryOptions,
	useDeleteFolderOptions,
	useExcludedFolderIds,
	useFolderMove,
	useFolderRename,
	useFolderSelector,
	useMoveOptions,
	usePathBuilder,
	useQueryMove,
	useQueryRename,
	useRenamingState,
} from "./hooks";
import { MoveModal } from "./modals/move";
import classes from "./style.module.scss";

interface QueryProps extends BoxProps, ElementProps<"button"> {
	query: QueryTab;
	queries: QueryTab[];
	folders: QueryFolder[];
	isActive: boolean;
	isLive: boolean;
	isDragging: boolean;
	onActivate: (id: string) => void;
	onRemoveQuery: (id: string) => void;
}

const Query = memo(function Query({
	query,
	queries,
	folders,
	isActive,
	isLive,
	isDragging,
	onActivate,
	onRemoveQuery,
	...other
}: QueryProps) {
	const { addQueryTab } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const { isRenaming, startRenaming, setIsRenaming } = useRenamingState();
	const { showFolderSelector, openFolderSelector, closeFolderSelector } = useFolderSelector();
	const [queryQuickClose] = useSetting("behavior", "queryQuickClose");
	const [connection] = useConnectionAndView();
	const isLight = useIsLight();

	const renameQuery = useQueryRename(queries);
	const moveQueryToFolder = useQueryMove(queries);
	const getInitialPath = usePathBuilder(folders);

	const handleActivate = useStable(() => {
		onActivate(query.id);
	});

	const handleRemoveQuery = useStable((id: string) => {
		onRemoveQuery(id);
	});

	const handleRemoveOthers = useStable((direction: "others" | "before" | "after") => {
		removeOthers(queries, query.id, direction, onRemoveQuery);
	});

	const handleRename = useStable((newName: string) => {
		renameQuery(query.id, newName);
	});

	const handleMove = useStable((folderId?: string) => {
		moveQueryToFolder(query.id, folderId);
	});

	const handleQuickRemove = useStable((e: React.MouseEvent) => {
		e.stopPropagation();
		onRemoveQuery(query.id);
	});

	const handleDuplicate = useStable(() => {
		if (!connection) return;

		addQueryTab(connection, {
			queryType: "config",
			name: query.name?.replace(/ \d+$/, ""),
			query: query.query,
			variables: query.variables,
		});
	});

	const moveOptions = useMoveOptions(
		query,
		folders,
		() => handleMove(undefined),
		() => {
			const currentFolder = query.parentId
				? folders.find((f) => f.id === query.parentId)
				: null;
			if (currentFolder) {
				handleMove(currentFolder.parentId);
			}
		},
	)();

	const deleteOptions = useCloseQueryOptions(
		query,
		queries,
		handleRemoveQuery,
		handleRemoveOthers,
	)();

	const contextMenuItems = buildQueryContextMenuItems(
		query,
		handleActivate,
		handleDuplicate,
		startRenaming,
		openFolderSelector,
		moveOptions,
		deleteOptions,
	);

	const buildContextMenu = showContextMenu(contextMenuItems);

	return (
		<>
			<Entry
				key={query.id}
				isActive={isActive}
				onClick={isRenaming ? undefined : handleActivate}
				className={clsx(classes.query, isDragging && classes.queryDragging)}
				onContextMenu={buildContextMenu}
				leftSection={<Icon path={TYPE_ICONS[query.queryType]} />}
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
					onChange={handleRename}
					activationMode="double-click"
					editable={isRenaming}
					onEditableChange={setIsRenaming}
					withDecoration
					className={classes.editableText}
				/>
			</Entry>

			<MoveModal
				opened={showFolderSelector}
				onClose={closeFolderSelector}
				title="Move Query"
				description={`Browse to the folder where you want to move "${query.name || "Untitled"}":`}
				folders={folders}
				queries={queries}
				initialPath={getInitialPath(query.parentId)}
				movingQueryId={query.id}
				onMove={handleMove}
			/>
		</>
	);
});

interface FolderProps extends BoxProps, ElementProps<"button"> {
	folder: QueryFolder;
	folders: QueryFolder[];
	queries: QueryTab[];
	onNavigate: (folderId: string) => void;
	onRemoveFolder: (folderId: string) => void;
}

const Folder = memo(function Folder({
	folder,
	folders,
	queries,
	onNavigate,
	onRemoveFolder,
	...other
}: FolderProps) {
	const { duplicateQueryFolder } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const { isRenaming, startRenaming, setIsRenaming } = useRenamingState();
	const { showFolderSelector, openFolderSelector, closeFolderSelector } = useFolderSelector();
	const [connection] = useConnectionAndView();

	const renameFolder = useFolderRename(folders);
	const moveFolderTo = useFolderMove(folders);
	const getInitialPath = usePathBuilder(folders);
	const getExcludedFolderIds = useExcludedFolderIds(folders);

	const handleNavigate = useStable(() => {
		onNavigate(folder.id);
	});

	const handleRename = useStable((newName: string) => {
		renameFolder(folder.id, newName);
	});

	const handleMove = useStable((targetParentId?: string) => {
		moveFolderTo(folder.id, targetParentId);
	});

	const handleDuplicate = useStable(() => {
		if (!connection) return;
		duplicateQueryFolder(connection, folder.id);
	});

	const handleExecuteAll = useStable(() => {
		executeAllQueriesInFolder(folder.id, queries, folders);
	});

	const moveOptions = useMoveOptions(
		folder,
		folders,
		() => handleMove(undefined),
		() => {
			const currentParentFolder = folder.parentId
				? folders.find((f) => f.id === folder.parentId)
				: null;
			if (currentParentFolder) {
				handleMove(currentParentFolder.parentId);
			}
		},
	)();

	const deleteOptions = useDeleteFolderOptions(folder, () => onRemoveFolder(folder.id))();

	const contextMenuItems = buildFolderContextMenuItems(
		handleNavigate,
		handleDuplicate,
		startRenaming,
		openFolderSelector,
		moveOptions,
		handleExecuteAll,
		deleteOptions,
	);

	const buildContextMenu = showContextMenu(contextMenuItems);

	return (
		<>
			<Entry
				key={folder.id}
				onClick={isRenaming ? undefined : handleNavigate}
				onContextMenu={buildContextMenu}
				leftSection={<Icon path={iconFolder} />}
				rightSection={<Icon path={iconChevronRight} />}
				{...other}
			>
				<EditableText
					value={folder.name || ""}
					onChange={handleRename}
					activationMode="double-click"
					editable={isRenaming}
					onEditableChange={setIsRenaming}
					withDecoration
					className={classes.editableText}
				/>
			</Entry>

			<MoveModal
				opened={showFolderSelector}
				onClose={closeFolderSelector}
				title="Move Folder"
				description={`Browse to the location where you want to move "${folder.name}":`}
				folders={folders}
				queries={queries}
				initialPath={getInitialPath(folder.parentId)}
				excludedFolderIds={getExcludedFolderIds(folder.id)}
				movingFolderId={folder.id}
				onMove={handleMove}
			/>
		</>
	);
});

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

const TabsPane = memo(function TabsPane(props: TabsPaneProps) {
	const { showContextMenu } = useContextMenu();
	const { removeQueryState } = useQueryStore.getState();
	const {
		updateConnection,
		addQueryTab,
		removeQueryTab,
		updateQueryTab,
		setActiveQueryTab,
		addQueryFolder,
		removeQueryFolder,
		removeQueryFolderCascade,
		updateQueryFolder,
		navigateToFolder,
		navigateToParentFolder,
		navigateToRoot,
	} = useConfigStore.getState();
	const [connection] = useConnectionAndView();
	const [activeQuery, queries, queryFolders, queryFolderPath] = useConnection((c) => [
		c?.activeQuery ?? "",
		c?.queries ?? [],
		c?.queryFolders ?? [],
		c?.queryFolderPath ?? [],
	]);
	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isLight = useIsLight();

	const newTab = useStable(() => {
		if (!connection) return;
		addQueryTab(connection, { queryType: "config" });
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

	const removeFolder = useStable((folderId: string) => {
		const folder = queryFolders.find((f) => f.id === folderId);
		if (!folder || !connection) return;

		const contents = getFolderContents(folderId, queries, queryFolders);

		// If folder is empty, delete it directly
		if (contents.totalQueries === 0 && contents.subfolders.length === 0) {
			removeQueryFolder(connection, folderId);
			return;
		}

		// Build content description
		const contentDescription = buildFolderContentDescription(contents);

		// Get current directory name for modal display
		const currentDirectoryName = currentFolderId
			? queryFolders.find((f) => f.id === currentFolderId)?.name
			: undefined;

		// Open the three-button modal
		openDeleteFolderModal({
			folderName: folder.name || "Untitled",
			contentDescription,
			currentDirectoryName,
			onMoveToCurrentDirectory: () => {
				removeQueryFolder(connection, folderId);
			},
			onDeleteEverything: () => {
				removeQueryFolderCascade(connection, folderId);
			},
		});
	});

	const saveItemOrder = useStable((items: (QueryTab | QueryFolder)[]) => {
		if (!connection) return;

		// Update movedAt timestamp for each item to reflect new order
		const now = Date.now();
		items.forEach((item, index) => {
			// Use small increments to preserve drag order
			const movedAt = now + index;

			if (item.type === "folder") {
				// It's a QueryFolder - update its timestamp
				updateQueryFolder(connection, {
					id: item.id,
					movedAt,
				});
			} else {
				// It's a QueryTab - update its timestamp
				updateQueryTab(connection, {
					id: item.id,
					movedAt,
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

	const navigateToActiveQuery = useStable(() => {
		if (!activeQuery || !connection) return;
		const query = queries.find((q) => q.id === activeQuery);
		if (query?.parentId) {
			navigateToFolder(connection, query.parentId);
		} else {
			navigateToRoot(connection);
		}
	});

	useIntent("navigate-to-active-query", navigateToActiveQuery);

	// Get current folder ID (last in path) or undefined for root
	const currentFolderId = useMemo(
		() =>
			queryFolderPath.length > 0 ? queryFolderPath[queryFolderPath.length - 1] : undefined,
		[queryFolderPath],
	);

	// Filter queries and folders for current context
	const currentQueries = useMemo(
		() => queries.filter((query) => query.parentId === currentFolderId),
		[queries, currentFolderId],
	);

	const currentFolders = useMemo(
		() => queryFolders.filter((folder) => folder.parentId === currentFolderId),
		[queryFolders, currentFolderId],
	);

	// Combine folders and queries for sortable list, sorted by timestamp
	const sortableItems = useMemo(
		(): (QueryFolder | QueryTab)[] =>
			sortItemsByTimestamp([...currentFolders, ...currentQueries]),
		[currentFolders, currentQueries],
	);

	// Build breadcrumb path
	const breadcrumbPath = useMemo(
		() => buildBreadcrumbPath(queryFolderPath, queryFolders),
		[queryFolderPath, queryFolders],
	);

	const { shouldTruncate, visibleBreadcrumbs, hiddenBreadcrumbs } = useMemo(
		() => truncateBreadcrumbPath(breadcrumbPath),
		[breadcrumbPath],
	);

	useIntent("new-query", newTab);

	useIntent("close-query", () => {
		if (activeQuery) {
			removeTab(activeQuery);
		}
	});
	// Build navigation options
	const navigateOptions = useMemo(() => {
		if (queryFolderPath.length === 0) return;
		return [
			{
				key: "navigate-to-root",
				icon: <Icon path={iconHome} />,
				title: "Navigate to root",
				onClick: handleNavigateToRoot,
			},
			{
				key: "navigate-back",
				icon: <Icon path={iconArrowLeft} />,
				title: "Navigate back",
				onClick: handleNavigateBack,
			},
		];
	}, [queryFolderPath.length]);

	const contextMenuItems = buildTabsPaneContextMenuItems(newTab, newFolder, navigateOptions);

	const buildContextMenu = showContextMenu(contextMenuItems);

	return (
		<ContentPane
			icon={iconList}
			title="Queries"
			style={{ flexShrink: 0 }}
			onContextMenu={buildContextMenu}
			infoSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{currentQueries.length}
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
				{queryFolderPath.length > 0 && (
					<div className={classes.breadcrumbContainer}>
						<Group
							gap="xs"
							className={classes.breadcrumbButtons}
						>
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
						</Group>

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
													const newPath = queryFolderPath.slice(
														0,
														index + 1,
													);
													updateConnection({
														id: connection,
														queryFolderPath: newPath,
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
																	queryFolderPath.slice(
																		0,
																		actualIndex,
																	);
																updateConnection({
																	id: connection,
																	queryFolderPath: newPath,
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
														const newPath = queryFolderPath.slice(
															0,
															actualIndex,
														);
														updateConnection({
															id: connection,
															queryFolderPath: newPath,
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
												const newPath = queryFolderPath.slice(0, index + 1);
												updateConnection({
													id: connection,
													queryFolderPath: newPath,
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
									// Check if item is a folder using type discriminator
									if (item.type === "folder") {
										const folder = item as QueryFolder;
										return (
											<Folder
												key={folder.id}
												folder={folder}
												folders={queryFolders}
												queries={queries}
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
												queries={queries}
												folders={queryFolders}
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
							<Center className={classes.emptyState}>
								<Text c="slate">
									{queryFolderPath.length > 0
										? "This folder is empty"
										: "No queries or folders"}
								</Text>
							</Center>
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
});

export { TabsPane };
