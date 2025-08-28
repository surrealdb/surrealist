import { ContextMenuContent, ContextMenuItemOptions } from "mantine-contextmenu";
import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { Icon } from "~/components/Icon";
import { executeUserQuery } from "~/screens/surrealist/connection/connection";
import { readQuery } from "~/screens/surrealist/views/query/QueryView/strategy";
import type { QueryFolder, QueryTab, QueryType } from "~/types";
import { showInfo, sortItemsByTimestamp } from "~/util/helpers";
import {
	iconArrowUpRight,
	iconCopy,
	iconFile,
	iconFolder,
	iconPlay,
	iconQuery,
	iconSearch,
	iconText,
} from "~/util/icons";

/**
 * Type icons mapping for queries
 */
export const TYPE_ICONS: Record<QueryType, string> = {
	config: iconQuery,
	file: iconFile,
};

/**
 * Recursively execute all queries in a folder and its subfolders
 */
export async function executeAllQueriesInFolder(
	folderId: string,
	queries: QueryTab[],
	queryFolders: QueryFolder[],
) {
	const folder = queryFolders.find((f) => f.id === folderId);
	if (!folder) return;

	// Find all queries in the folder (recursively)
	const getAllQueriesInFolder = (targetFolderId: string): QueryTab[] => {
		const directQueries = queries.filter((q) => q.parentId === targetFolderId);
		const subfolders = queryFolders.filter((f) => f.parentId === targetFolderId);

		let allQueries = [...directQueries];
		for (const subfolder of subfolders) {
			allQueries = allQueries.concat(getAllQueriesInFolder(subfolder.id));
		}

		return allQueries;
	};

	const folderQueries = getAllQueriesInFolder(folderId);

	if (folderQueries.length === 0) {
		showInfo({
			title: "No queries found",
			subtitle: `Folder "${folder.name}" contains no queries to execute`,
		});
		return;
	}

	// Combine all queries into one execution
	const queryPromises = folderQueries.map(async (queryTab) => {
		try {
			const queryContent = await readQuery(queryTab);
			return typeof queryContent === "string" ? queryContent : queryContent;
		} catch (error) {
			console.warn(`Failed to read query ${queryTab.name}:`, error);
			return "";
		}
	});

	const queryContents = await Promise.all(queryPromises);
	const validQueries = queryContents.filter((content) => content.trim().length > 0);

	if (validQueries.length === 0) {
		showInfo({
			title: "No valid queries",
			subtitle: `All queries in folder "${folder.name}" are empty`,
		});
		return;
	}

	// Combine all queries with semicolons and execute
	const combinedQuery = validQueries.join(";\n\n");

	showInfo({
		title: "Executing folder queries",
		subtitle: `Running ${validQueries.length} quer${validQueries.length === 1 ? "y" : "ies"} from "${folder.name}"`,
	});

	executeUserQuery({ override: combinedQuery });
}

/**
 * Helper function to count folder contents recursively
 */
export function getFolderContents(
	folderId: string,
	queries: QueryTab[],
	queryFolders: QueryFolder[],
) {
	const getChildFolders = (parentId: string): QueryFolder[] => {
		const children = queryFolders.filter((f) => f.parentId === parentId);
		let allChildren = [...children];
		for (const child of children) {
			allChildren = allChildren.concat(getChildFolders(child.id));
		}
		return allChildren;
	};

	const childFolders = getChildFolders(folderId);
	const affectedFolderIds = [folderId, ...childFolders.map((f) => f.id)];
	const queriesInFolders = queries.filter((q) => affectedFolderIds.includes(q.parentId || ""));

	return {
		subfolders: childFolders,
		queries: queriesInFolders,
		totalFolders: childFolders.length + 1, // +1 for the folder itself
		totalQueries: queriesInFolders.length,
	};
}

/**
 * Build content description for folder deletion
 */
export function buildFolderContentDescription(contents: ReturnType<typeof getFolderContents>) {
	const parts: string[] = [];
	if (contents.subfolders.length > 0) {
		parts.push(
			`${contents.subfolders.length} subfolder${contents.subfolders.length === 1 ? "" : "s"}`,
		);
	}
	if (contents.totalQueries > 0) {
		parts.push(`${contents.totalQueries} quer${contents.totalQueries === 1 ? "y" : "ies"}`);
	}
	return `This folder contains ${parts.join(" and ")}.`;
}

/**
 * Remove other queries based on direction, scoped to the current folder
 */
export function removeOthers(
	queries: QueryTab[],
	targetId: string,
	direction: "others" | "before" | "after",
	onRemoveQuery: (id: string) => void,
) {
	const targetQuery = queries.find((q) => q.id === targetId);
	if (!targetQuery) return;

	// Get queries in the same folder as the target query
	const folderQueries = queries.filter((q) => q.parentId === targetQuery.parentId);

	// Sort folder queries by timestamp
	const sortedFolderQueries = sortItemsByTimestamp(folderQueries);

	// Find the index within the sorted folder queries
	const folderIndex = sortedFolderQueries.findIndex((q) => q.id === targetId);

	for (const query of folderQueries) {
		if (query.id === targetId) continue;

		const queryFolderIndex = sortedFolderQueries.findIndex((q) => q.id === query.id);

		if (
			direction === "others" ||
			(direction === "before" && queryFolderIndex < folderIndex) ||
			(direction === "after" && queryFolderIndex > folderIndex)
		) {
			onRemoveQuery(query.id);
		}
	}
}

/**
 * Build breadcrumb path from folder path
 */
export function buildBreadcrumbPath(queryFolderPath: string[], queryFolders: QueryFolder[]) {
	return queryFolderPath.map((folderId) => {
		const folder = queryFolders.find((f) => f.id === folderId);
		return { id: folderId, name: folder?.name || "Unknown" };
	});
}

/**
 * Truncate breadcrumb path for display
 */
export function truncateBreadcrumbPath(
	breadcrumbPath: Array<{ id: string; name: string }>,
	maxVisible = 2,
) {
	const shouldTruncate = breadcrumbPath.length > maxVisible;

	if (!shouldTruncate) {
		return {
			shouldTruncate: false,
			visibleBreadcrumbs: breadcrumbPath,
			hiddenBreadcrumbs: [],
		};
	}

	// Show first folder + ellipsis + last folder
	const firstItem = breadcrumbPath.slice(0, 1);
	const lastItem = breadcrumbPath.slice(-1);
	const hiddenBreadcrumbs = breadcrumbPath.slice(1, -1);
	const visibleBreadcrumbs = [...firstItem, ...lastItem];

	return {
		shouldTruncate: true,
		visibleBreadcrumbs,
		hiddenBreadcrumbs,
	};
}

/**
 * Get the explorer name based on platform
 */
export function getExplorerName() {
	return adapter.platform === "darwin" ? "Finder" : "Explorer";
}

/**
 * Handle opening file in system explorer
 */
export function openInExplorer(query: QueryTab) {
	if (adapter instanceof DesktopAdapter) {
		adapter.openInExplorer(query);
	}
}

/**
 * Build context menu items for a query
 */
export function buildQueryContextMenuItems(
	query: QueryTab,
	onActivate: () => void,
	onDuplicate: () => void,
	onRename: () => void,
	onMoveTo: () => void,
	moveOptions: ContextMenuItemOptions[] | undefined,
	deleteOptions: ContextMenuItemOptions[] | undefined,
) {
	const explorerName = getExplorerName();

	const content: ContextMenuContent = [
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: onActivate,
		},
		{
			hidden: query.queryType !== "file",
			key: "open-in-explorer",
			title: `Reveal in ${explorerName}`,
			icon: <Icon path={iconSearch} />,
			onClick: () => openInExplorer(query),
		},
		{
			key: "duplicate",
			title: "Duplicate",
			icon: <Icon path={iconCopy} />,
			onClick: onDuplicate,
		},
		{
			key: "rename",
			title: "Rename",
			icon: <Icon path={iconText} />,
			onClick: onRename,
		},
		{
			key: "move-to",
			title: "Move to...",
			icon: <Icon path={iconFolder} />,
			onClick: onMoveTo,
		},
	];

	// Add move options if they exist
	if (moveOptions && moveOptions.length > 0) {
		content.push(...moveOptions);
	}

	// Add delete options if they exist
	if (deleteOptions && deleteOptions.length > 0) {
		content.push(
			{
				key: "delete-div",
			},
			...deleteOptions,
		);
	}

	return content;
}

/**
 * Build base context menu items for folders
 */
export function buildFolderContextMenuItems(
	onNavigate: () => void,
	onDuplicate: () => void,
	onRename: () => void,
	onMoveTo: () => void,
	moveOptions: ContextMenuItemOptions[] | undefined,
	onExecuteAll: () => void,
	deleteOptions: ContextMenuItemOptions[] | undefined,
) {
	const content: ContextMenuContent = [
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: onNavigate,
		},
		{
			key: "duplicate",
			title: "Duplicate",
			icon: <Icon path={iconCopy} />,
			onClick: onDuplicate,
		},
		{
			key: "rename",
			title: "Rename",
			icon: <Icon path={iconText} />,
			onClick: onRename,
		},
		{
			key: "move-to",
			title: "Move to...",
			icon: <Icon path={iconFolder} />,
			onClick: onMoveTo,
		},
	];

	// Add move options if they exist
	if (moveOptions && moveOptions.length > 0) {
		content.push(...moveOptions);
	}

	// Add execute all queries option
	content.push(
		{
			key: "execute-div",
		},
		{
			key: "execute-all",
			title: "Execute all queries",
			icon: <Icon path={iconPlay} />,
			onClick: onExecuteAll,
		},
	);

	// Add delete options if they exist
	if (deleteOptions && deleteOptions.length > 0) {
		content.push(
			{
				key: "delete-div",
			},
			...deleteOptions,
		);
	}

	return content;
}

/**
 * Build context menu items for the tabs pane
 */
export function buildTabsPaneContextMenuItems(
	onNewQuery: () => void,
	onNewFolder: () => void,
	navigateOptions: ContextMenuItemOptions[] | undefined,
) {
	const content: ContextMenuContent = [
		{
			key: "new-query",
			icon: <Icon path={iconQuery} />,
			title: "New query",
			onClick: onNewQuery,
		},
		{
			key: "new-folder",
			icon: <Icon path={iconFolder} />,
			title: "New folder",
			onClick: onNewFolder,
		},
	];

	// Add navigation options if they exist
	if (navigateOptions && navigateOptions.length > 0) {
		content.push(
			{
				key: "navigate-div",
			},
			...navigateOptions,
		);
	}

	return content;
}
