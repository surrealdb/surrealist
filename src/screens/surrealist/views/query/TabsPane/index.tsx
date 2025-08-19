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
import { openDeleteFolderModal } from "~/modals/delete-folder";
import { openDeleteFolderCascadeModal } from "~/modals/delete-folder-cascade";
import { cancelLiveQueries } from "~/screens/surrealist/connection/connection";
import { ItemExplorer } from "~/screens/surrealist/pages/ItemExplorer";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type { Folder, QueryTab, QueryType } from "~/types";
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
	folders: Folder[];
	isActive: boolean;
	isLive: boolean;
	isDragging: boolean;
	onActivate: (id: string) => void;
	onRemoveQuery: (id: string) => void;
}

function Query({
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
	const { addQueryTab, updateQueryTab } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const [isRenaming, setIsRenaming] = useState(false);
	const [showFolderSelector, setShowFolderSelector] = useState(false);
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

	const moveQueryToFolder = useStable((queryId: string, folderId?: string) => {
		if (!connection) return;

		updateQueryTab(connection, {
			id: queryId,
			folderId: folderId,
		});
	});

	// Build initial path for ItemExplorer based on query's current folder
	const getInitialPath = useStable(() => {
		if (!query.folderId) return [];

		const buildPathToFolder = (folderId: string): string[] => {
			const folder = folders.find((f) => f.id === folderId);
			if (!folder) return [];

			const parentPath = folder.parentId ? buildPathToFolder(folder.parentId) : [];
			return [...parentPath, folder.id];
		};

		return buildPathToFolder(query.folderId);
	});

	const handleQuickRemove = useStable((e: React.MouseEvent) => {
		e.stopPropagation();
		onRemoveQuery(query.id);
	});

	// Build move options dynamically
	const moveOptions = [];

	// Add "Move to Root" if query is currently in a folder
	if (query.folderId !== undefined) {
		moveOptions.push({
			key: "move-to-root",
			title: "Move to Root",
			icon: <Icon path={iconHome} />,
			onClick: () => moveQueryToFolder(query.id, undefined),
		});
	}

	// Add "Move to Parent" if query is in a nested folder
	const currentFolder = query.folderId ? folders.find((f) => f.id === query.folderId) : null;
	const parentFolder = currentFolder?.parentId
		? folders.find((f) => f.id === currentFolder.parentId)
		: null;

	if (currentFolder && currentFolder.parentId !== undefined) {
		moveOptions.push({
			key: "move-to-parent",
			title: `Move to ${parentFolder ? parentFolder.name : "Root"}`,
			icon: <Icon path={iconArrowLeft} />,
			onClick: () => moveQueryToFolder(query.id, currentFolder.parentId),
		});
	}

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
		...moveOptions,
		{
			key: "move-to",
			title: "Move to...",
			icon: <Icon path={iconFolder} />,
			onClick: () => setShowFolderSelector(true),
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
		<>
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

			<ItemExplorer
				opened={showFolderSelector}
				onClose={() => setShowFolderSelector(false)}
				title="Move Query"
				description={`Browse to the folder where you want to move "${query.name || "Untitled"}":`}
				folders={folders}
				items={queries}
				initialPath={getInitialPath()}
				movingItemId={query.id}
				onMove={(folderId) => moveQueryToFolder(query.id, folderId)}
				getItemIcon={(item) => TYPE_ICONS[item.type]}
				getItemName={(item) => item.name || "Untitled"}
			/>
		</>
	);
}

interface FolderProps extends BoxProps, ElementProps<"button"> {
	folder: Folder;
	folders: Folder[];
	queries: QueryTab[];
	onNavigate: (folderId: string) => void;
	onRemoveFolder: (folderId: string) => void;
}

function FolderComponent({
	folder,
	folders,
	queries,
	onNavigate,
	onRemoveFolder,
	...other
}: FolderProps) {
	const { updateQueryFolder } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const [isRenaming, setIsRenaming] = useState(false);
	const [showFolderSelector, setShowFolderSelector] = useState(false);
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

	const moveFolderTo = useStable((targetParentId?: string) => {
		if (!connection) return;

		updateQueryFolder(connection, {
			id: folder.id,
			parentId: targetParentId,
		});
	});

	// Build initial path for ItemExplorer based on folder's current parent
	const getInitialPath = useStable(() => {
		if (!folder.parentId) return [];

		const buildPathToFolder = (folderId: string): string[] => {
			const folder = folders.find((f) => f.id === folderId);
			if (!folder) return [];

			const parentPath = folder.parentId ? buildPathToFolder(folder.parentId) : [];
			return [...parentPath, folder.id];
		};

		return buildPathToFolder(folder.parentId);
	});

	// Get excluded folder IDs (folder itself and all descendants)
	const getExcludedFolderIds = useStable(() => {
		const excludeFolderAndDescendants = (folderId: string): string[] => {
			const result = [folderId];
			const children = folders.filter((f) => f.parentId === folderId);
			for (const child of children) {
				result.push(...excludeFolderAndDescendants(child.id));
			}
			return result;
		};

		return excludeFolderAndDescendants(folder.id);
	});

	// Build move options dynamically for folder
	const folderMoveOptions = [];

	// Add "Move to Root" if folder is currently in a parent folder
	if (folder.parentId !== undefined) {
		folderMoveOptions.push({
			key: "move-to-root",
			title: "Move to Root",
			icon: <Icon path={iconHome} />,
			onClick: () => moveFolderTo(undefined),
		});
	}

	// Add "Move to Parent" if folder is in a nested folder
	const currentParentFolder = folder.parentId
		? folders.find((f) => f.id === folder.parentId)
		: null;
	const grandParentFolder = currentParentFolder?.parentId
		? folders.find((f) => f.id === currentParentFolder.parentId)
		: null;

	if (currentParentFolder && currentParentFolder.parentId !== undefined) {
		folderMoveOptions.push({
			key: "move-to-parent",
			title: `Move to ${grandParentFolder ? grandParentFolder.name : "Root"}`,
			icon: <Icon path={iconArrowLeft} />,
			onClick: () => moveFolderTo(currentParentFolder.parentId),
		});
	}

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
		...folderMoveOptions,
		{
			key: "move-to",
			title: "Move to...",
			icon: <Icon path={iconFolder} />,
			onClick: () => setShowFolderSelector(true),
		},
		{
			key: "delete-div",
		},
		{
			key: "delete",
			title: "Delete folder",
			onClick: () => onRemoveFolder(folder.id),
		},
	]);

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

			<ItemExplorer
				opened={showFolderSelector}
				onClose={() => setShowFolderSelector(false)}
				title="Move Folder"
				description={`Browse to the location where you want to move "${folder.name}":`}
				folders={folders}
				items={queries}
				initialPath={getInitialPath()}
				excludedFolderIds={getExcludedFolderIds()}
				movingFolderId={folder.id}
				onMove={(folderId) => moveFolderTo(folderId)}
				getItemIcon={(item) => TYPE_ICONS[item.type]}
				getItemName={(item) => item.name || "Untitled"}
			/>
		</>
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
		removeQueryFolderToRoot,
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

	// Helper function to count folder contents recursively
	const getFolderContents = useStable((folderId: string) => {
		const getChildFolders = (parentId: string): Folder[] => {
			const children = queryFolders.filter((f) => f.parentId === parentId);
			let allChildren = [...children];
			for (const child of children) {
				allChildren = allChildren.concat(getChildFolders(child.id));
			}
			return allChildren;
		};

		const childFolders = getChildFolders(folderId);
		const affectedFolderIds = [folderId, ...childFolders.map((f) => f.id)];
		const queriesInFolders = queries.filter((q) =>
			affectedFolderIds.includes(q.folderId || ""),
		);

		return {
			subfolders: childFolders,
			queries: queriesInFolders,
			totalFolders: childFolders.length + 1, // +1 for the folder itself
			totalQueries: queriesInFolders.length,
		};
	});

	const removeFolder = useStable((folderId: string) => {
		const folder = queryFolders.find((f) => f.id === folderId);
		if (!folder || !connection) return;

		const contents = getFolderContents(folderId);

		// If folder is empty, delete it directly
		if (contents.totalQueries === 0 && contents.subfolders.length === 0) {
			removeQueryFolder(connection, folderId);
			return;
		}

		// Build content description
		const parts: string[] = [];
		if (contents.subfolders.length > 0) {
			parts.push(
				`${contents.subfolders.length} subfolder${contents.subfolders.length === 1 ? "" : "s"}`,
			);
		}
		if (contents.totalQueries > 0) {
			parts.push(`${contents.totalQueries} quer${contents.totalQueries === 1 ? "y" : "ies"}`);
		}
		const contentDescription = `This folder contains ${parts.join(" and ")}.`;

		// Open the three-button modal
		openDeleteFolderModal({
			folderName: folder.name,
			contentDescription,
			onMoveToRoot: () => {
				removeQueryFolderToRoot(connection, folderId);
			},
			onDeleteEverything: () => {
				const cascadeDescription = `This will permanently delete the folder and all ${parts.join(" and ")}.`;
				openDeleteFolderCascadeModal({
					folderName: folder.name,
					contentDescription: cascadeDescription,
					onConfirm: () => {
						removeQueryFolderCascade(connection, folderId);
					},
				});
			},
		});
	});

	const saveItemOrder = useStable((items: (QueryTab | Folder)[]) => {
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

	const navigateToActiveQuery = useStable(() => {
		if (!activeQuery || !connection) return;
		const query = queries.find((q) => q.id === activeQuery);
		if (query?.folderId) {
			navigateToFolder(connection, query.folderId);
		} else {
			navigateToRoot(connection);
		}
	});

	useIntent("navigate-to-active-query", navigateToActiveQuery);

	// Get current folder ID (last in path) or undefined for root
	const currentFolderId =
		queryFolderPath.length > 0 ? queryFolderPath[queryFolderPath.length - 1] : undefined;

	// Filter queries and folders for current context
	const currentQueries = queries
		.filter((query) => query.folderId === currentFolderId)
		.sort((a, b) => a.order - b.order);
	const currentFolders = queryFolders
		.filter((folder) => folder.parentId === currentFolderId)
		.sort((a, b) => a.order - b.order);

	// Combine folders and queries for sortable list, sorted by order
	const sortableItems: (Folder | QueryTab)[] = [...currentFolders, ...currentQueries].sort(
		(a, b) => a.order - b.order,
	);

	// Build breadcrumb path
	const breadcrumbPath = queryFolderPath.map((folderId) => {
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
				{queryFolderPath.length > 0 && (
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
									// Check if item is a folder
									if ("parentId" in item) {
										const folder = item as Folder;
										return (
											<FolderComponent
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
							<div style={{ textAlign: "center", padding: "2rem", color: "gray" }}>
								{queryFolderPath.length > 0
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
