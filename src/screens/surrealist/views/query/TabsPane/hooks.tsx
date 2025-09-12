import { useState } from "react";
import { Icon } from "~/components/Icon";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { OrganizableItemType, QueryFolder, QueryTab } from "~/types";
import { sortItemsByTimestamp, uniqueNameInScope } from "~/util/helpers";
import { iconArrowLeft, iconHome } from "~/util/icons";

/**
 * Hook for managing item renaming operations (queries and folders)
 */
export function useItemRename<T extends { id: string; name?: string }>(
	items: T[],
	getCurrentScope: (item: T) => string | undefined,
	updateItem: (connection: string, updates: Partial<T> & { id: string }) => void,
) {
	const [connection] = useConnectionAndView();

	return useStable((id: string, newName: string) => {
		if (!connection) return;

		// Find the item being renamed to get its current scope
		const itemToRename = items.find((item) => item.id === id);
		if (!itemToRename) return;

		const currentScope = getCurrentScope(itemToRename);

		// Use scoped naming - only check for conflicts within the same scope
		const name = uniqueNameInScope(
			newName || "New item",
			items,
			(item) => item.name ?? "",
			(item) => getCurrentScope(item) === currentScope && item.id !== id,
		);

		updateItem(connection, { id, name } as Partial<T> & { id: string });
	});
}

/**
 * Hook for managing query renaming operations
 */
export function useQueryRename(queries: QueryTab[]) {
	const { updateQueryTab } = useConfigStore.getState();

	return useItemRename(queries, (query) => query.parentId, updateQueryTab);
}

/**
 * Hook for managing folder renaming operations
 */
export function useFolderRename(folders: QueryFolder[]) {
	const { updateQueryFolder } = useConfigStore.getState();

	return useItemRename(folders, (folder) => folder.parentId, updateQueryFolder);
}

/**
 * Hook for moving queries between folders
 */
export function useQueryMove(queries: QueryTab[]) {
	const { updateQueryTab } = useConfigStore.getState();
	const [connection] = useConnectionAndView();

	return useStable((itemId: string, targetFolderId?: string) => {
		if (!connection) return;

		// Find the query being moved
		const queryToMove = queries.find((query) => query.id === itemId);
		if (!queryToMove) return;

		// Check if the name would conflict in the target folder and resolve if needed
		const resolvedName = uniqueNameInScope(
			queryToMove.name || "New query",
			queries,
			(query) => query.name ?? "",
			(query) => query.parentId === targetFolderId && query.id !== itemId,
		);

		// Update the folder and set moved timestamp - it will naturally append to the end
		const updates = {
			id: itemId,
			parentId: targetFolderId,
			movedAt: Date.now(),
			...(resolvedName !== queryToMove.name && { name: resolvedName }),
		};

		updateQueryTab(connection, updates);
	});
}

/**
 * Hook for moving folders between parent folders
 */
export function useFolderMove(folders: QueryFolder[]) {
	const { updateQueryFolder } = useConfigStore.getState();
	const [connection] = useConnectionAndView();

	return useStable((itemId: string, targetParentId?: string) => {
		if (!connection) return;

		// Find the folder being moved
		const folderToMove = folders.find((folder) => folder.id === itemId);
		if (!folderToMove) return;

		// Check if the name would conflict in the target parent and resolve if needed
		const resolvedName = uniqueNameInScope(
			folderToMove.name || "New folder",
			folders,
			(folder) => folder.name ?? "",
			(folder) => folder.parentId === targetParentId && folder.id !== itemId,
		);

		// Update the parent and set moved timestamp - it will naturally append to the end
		const updates = {
			id: itemId,
			parentId: targetParentId,
			movedAt: Date.now(),
			...(resolvedName !== folderToMove.name && { name: resolvedName }),
		};

		updateQueryFolder(connection, updates);
	});
}

/**
 * Hook for building paths to folders for MoveModal navigation
 */
export function usePathBuilder(folders: QueryFolder[]) {
	return useStable((targetFolderId?: string) => {
		if (!targetFolderId) return [];

		const buildPathToFolder = (folderId: string): string[] => {
			const folder = folders.find((f) => f.id === folderId);
			if (!folder) return [];

			const parentPath = folder.parentId ? buildPathToFolder(folder.parentId) : [];
			return [...parentPath, folder.id];
		};

		return buildPathToFolder(targetFolderId);
	});
}

/**
 * Hook for getting excluded folder IDs (folder itself and all descendants)
 */
export function useExcludedFolderIds(folders: QueryFolder[]) {
	return useStable((folderId: string) => {
		const excludeFolderAndDescendants = (targetFolderId: string): string[] => {
			const result = [targetFolderId];
			const children = folders.filter((f) => f.parentId === targetFolderId);
			for (const child of children) {
				result.push(...excludeFolderAndDescendants(child.id));
			}
			return result;
		};

		return excludeFolderAndDescendants(folderId);
	});
}

/**
 * Hook for managing folder selector state
 */
export function useFolderSelector() {
	const [showFolderSelector, setShowFolderSelector] = useState(false);

	return {
		showFolderSelector,
		openFolderSelector: useStable(() => setShowFolderSelector(true)),
		closeFolderSelector: useStable(() => setShowFolderSelector(false)),
	};
}

/**
 * Hook for managing renaming state
 */
export function useRenamingState() {
	const [isRenaming, setIsRenaming] = useState(false);

	return {
		isRenaming,
		startRenaming: useStable(() => setIsRenaming(true)),
		stopRenaming: useStable(() => setIsRenaming(false)),
		setIsRenaming,
	};
}

/**
 * Hook for building move options for context menus
 */
export function useMoveOptions<
	T extends { id: string; parentId?: string; type: OrganizableItemType },
>(item: T, folders: QueryFolder[], onMoveToRoot: () => void, onMoveToParent: () => void) {
	return useStable(() => {
		const moveOptions = [];
		const currentParentId = item.parentId;

		// Add "Move to Root" if item is currently in a folder
		if (currentParentId !== undefined) {
			moveOptions.push({
				key: "move-to-root",
				icon: <Icon path={iconHome} />,
				title: "Move to Root",
				onClick: onMoveToRoot,
			});
		}

		// Add "Move to Parent" if item is in a nested folder
		const currentFolder = currentParentId
			? folders.find((f) => f.id === currentParentId)
			: null;
		const parentFolder = currentFolder?.parentId
			? folders.find((f) => f.id === currentFolder.parentId)
			: null;

		if (currentFolder && currentFolder.parentId !== undefined) {
			moveOptions.push({
				key: "move-to-parent",
				icon: <Icon path={iconArrowLeft} />,
				title: `Move to ${parentFolder ? parentFolder.name : "Root"}`,
				onClick: onMoveToParent,
			});
		}

		return moveOptions;
	});
}

/**
 * Hook for building close options for queries
 */
export function useCloseQueryOptions(
	query: QueryTab,
	queries: QueryTab[],
	onClose: (id: string) => void,
	onCloseOthers: (direction: "others" | "before" | "after") => void,
) {
	return useStable(() => {
		// Don't show close options if there's only one query
		if (queries.length === 1) return;

		// Get queries in the same folder as the current query
		const folderQueries = queries.filter((q) => q.parentId === query.parentId);

		const options = [
			{
				key: "close",
				title: "Close",
				onClick: () => onClose(query.id),
			},
		];

		// Only show "Close Others" if there are other queries in the same folder
		if (folderQueries.length > 1) {
			options.push({
				key: "close-others",
				title: "Close Others",
				onClick: () => onCloseOthers("others"),
			});
		}

		// Sort folder queries by timestamp
		const sortedFolderQueries = sortItemsByTimestamp(folderQueries);

		// Get the index within the sorted folder queries
		const folderIndex = sortedFolderQueries.findIndex((q) => q.id === query.id);

		// Add "Close Before" if not the first query in the folder
		if (folderIndex > 0) {
			options.push({
				key: "close-before",
				title: "Close queries Before",
				onClick: () => onCloseOthers("before"),
			});
		}

		// Add "Close After" if not the last query in the folder
		if (folderIndex < sortedFolderQueries.length - 1) {
			options.push({
				key: "close-after",
				title: "Close queries After",
				onClick: () => onCloseOthers("after"),
			});
		}

		return options;
	});
}

/**
 * Hook for building delete options for folders
 */
export function useDeleteFolderOptions(folder: QueryFolder, onRemove: (id: string) => void) {
	return useStable(() => {
		const options = [
			{
				key: "delete",
				title: "Delete",
				onClick: () => onRemove(folder.id),
			},
		];

		return options;
	});
}
