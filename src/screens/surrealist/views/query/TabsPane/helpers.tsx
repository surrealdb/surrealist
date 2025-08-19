import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { Icon } from "~/components/Icon";
import { executeUserQuery } from "~/screens/surrealist/connection/connection";
import { readQuery } from "~/screens/surrealist/views/query/QueryView/strategy";
import type { Folder, QueryTab, QueryType } from "~/types";
import { showInfo } from "~/util/helpers";
import {
	iconArrowLeft,
	iconArrowUpRight,
	iconCopy,
	iconFile,
	iconFolder,
	iconHome,
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
	queryFolders: Folder[],
) {
	const folder = queryFolders.find((f) => f.id === folderId);
	if (!folder) return;

	// Find all queries in the folder (recursively)
	const getAllQueriesInFolder = (targetFolderId: string): QueryTab[] => {
		const directQueries = queries.filter((q) => q.folderId === targetFolderId);
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
export function getFolderContents(folderId: string, queries: QueryTab[], queryFolders: Folder[]) {
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
	const queriesInFolders = queries.filter((q) => affectedFolderIds.includes(q.folderId || ""));

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
 * Build cascade deletion description
 */
export function buildCascadeDescription(contents: ReturnType<typeof getFolderContents>) {
	const parts: string[] = [];
	if (contents.subfolders.length > 0) {
		parts.push(
			`${contents.subfolders.length} subfolder${contents.subfolders.length === 1 ? "" : "s"}`,
		);
	}
	if (contents.totalQueries > 0) {
		parts.push(`${contents.totalQueries} quer${contents.totalQueries === 1 ? "y" : "ies"}`);
	}
	return `This will permanently delete the folder and all ${parts.join(" and ")}.`;
}

/**
 * Remove other queries based on direction
 */
export function removeOthers(
	queries: QueryTab[],
	targetId: string,
	direction: number,
	onRemoveQuery: (id: string) => void,
) {
	const index = queries.findIndex((q) => q.id === targetId);

	for (const [i, query] of queries.entries()) {
		if (
			query.id !== targetId &&
			(direction === 0 || (direction === -1 && i < index) || (direction === 1 && i > index))
		) {
			onRemoveQuery(query.id);
		}
	}
}

/**
 * Build breadcrumb path from folder path
 */
export function buildBreadcrumbPath(queryFolderPath: string[], queryFolders: Folder[]) {
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
 * Build base context menu items for queries
 */
export function buildQueryContextMenuItems(
	query: QueryTab,
	queries: QueryTab[],
	onActivate: () => void,
	onDuplicate: () => void,
	onRename: () => void,
	onRemove: () => void,
	onRemoveOthers: (direction: number) => void,
	moveOptions: Array<{ key: string; title: string; onClick: () => void }>,
	onMoveToFolder: () => void,
) {
	const explorerName = getExplorerName();

	return [
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: onActivate,
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
		...moveOptions.map((option) => ({
			...option,
			icon:
				option.key === "move-to-root" ? (
					<Icon path={iconHome} />
				) : (
					<Icon path={iconArrowLeft} />
				),
		})),
		{
			key: "move-to",
			title: "Move to...",
			icon: <Icon path={iconFolder} />,
			onClick: onMoveToFolder,
		},
		{
			hidden: query.type !== "file",
			key: "open-in-explorer",
			title: `Reveal in ${explorerName}`,
			icon: <Icon path={iconSearch} />,
			onClick: () => openInExplorer(query),
		},
		{
			key: "close-div",
		},
		{
			key: "close",
			title: "Close",
			disabled: queries.length === 1,
			onClick: onRemove,
		},
		{
			key: "close-others",
			title: "Close Others",
			disabled: queries.length === 1,
			onClick: () => onRemoveOthers(0),
		},
		{
			key: "close-before",
			title: "Close queries Before",
			disabled: queries.length === 1 || queries.findIndex((q) => q.id === query.id) === 0,
			onClick: () => onRemoveOthers(-1),
		},
		{
			key: "close-after",
			title: "Close queries After",
			disabled:
				queries.length === 1 ||
				queries.findIndex((q) => q.id === query.id) >= queries.length - 1,
			onClick: () => onRemoveOthers(1),
		},
	];
}

/**
 * Build base context menu items for folders
 */
export function buildFolderContextMenuItems(
	onNavigate: () => void,
	onRename: () => void,
	onRemove: () => void,
	onExecuteAll: () => void,
	moveOptions: Array<{ key: string; title: string; onClick: () => void }>,
	onMoveToFolder: () => void,
) {
	return [
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: onNavigate,
		},
		{
			key: "rename",
			title: "Rename",
			icon: <Icon path={iconText} />,
			onClick: onRename,
		},
		...moveOptions.map((option) => ({
			...option,
			icon:
				option.key === "move-to-root" ? (
					<Icon path={iconHome} />
				) : (
					<Icon path={iconArrowLeft} />
				),
		})),
		{
			key: "move-to",
			title: "Move to...",
			icon: <Icon path={iconFolder} />,
			onClick: onMoveToFolder,
		},
		{
			key: "execute-div",
		},
		{
			key: "execute-all",
			title: "Execute all queries",
			icon: <Icon path={iconPlay} />,
			onClick: onExecuteAll,
		},
		{
			key: "delete-div",
		},
		{
			key: "delete",
			title: "Delete folder",
			onClick: onRemove,
		},
	];
}
