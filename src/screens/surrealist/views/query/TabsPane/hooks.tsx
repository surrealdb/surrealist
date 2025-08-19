import { useState } from "react";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { Folder, QueryTab } from "~/types";
import { uniqueNameInScope } from "~/util/helpers";

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

	return useItemRename(queries, (query) => query.folderId, updateQueryTab);
}

/**
 * Hook for managing folder renaming operations
 */
export function useFolderRename(folders: Folder[]) {
	const { updateQueryFolder } = useConfigStore.getState();

	return useItemRename(folders, (folder) => folder.parentId, updateQueryFolder);
}

/**
 * Hook for managing item movement operations with conflict resolution
 */
export function useItemMove<T extends { id: string; name?: string }>(
	items: T[],
	getTargetScope: (targetId?: string) => string | undefined,
	updateItem: (connection: string, updates: Partial<T> & { id: string }) => void,
	targetKey: keyof T,
) {
	const [connection] = useConnectionAndView();

	return useStable((itemId: string, targetId?: string) => {
		if (!connection) return;

		// Find the item being moved to check for naming conflicts in the target scope
		const itemToMove = items.find((item) => item.id === itemId);
		if (!itemToMove) return;

		const targetScope = getTargetScope(targetId);

		// Check if the name would conflict in the target scope and resolve if needed
		const resolvedName = uniqueNameInScope(
			itemToMove.name || "New item",
			items,
			(item) => item.name ?? "",
			(item) =>
				getTargetScope(item[targetKey] as string | undefined) === targetScope &&
				item.id !== itemId,
		);

		const updates: Partial<T> & { id: string } = {
			id: itemId,
			[targetKey]: targetId,
		} as Partial<T> & { id: string };

		if (resolvedName !== itemToMove.name) {
			(updates as any).name = resolvedName;
		}

		updateItem(connection, updates);
	});
}

/**
 * Hook for moving queries between folders
 */
export function useQueryMove(queries: QueryTab[]) {
	const { updateQueryTab } = useConfigStore.getState();

	return useItemMove(
		queries,
		(folderId) => folderId,
		updateQueryTab,
		"folderId" as keyof QueryTab,
	);
}

/**
 * Hook for moving folders between parent folders
 */
export function useFolderMove(folders: Folder[]) {
	const { updateQueryFolder } = useConfigStore.getState();

	return useItemMove(
		folders,
		(parentId) => parentId,
		updateQueryFolder,
		"parentId" as keyof Folder,
	);
}

/**
 * Hook for building paths to folders for ItemExplorer navigation
 */
export function usePathBuilder(folders: Folder[]) {
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
export function useExcludedFolderIds(folders: Folder[]) {
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
export function useMoveOptions<T extends { id: string; parentId?: string; folderId?: string }>(
	item: T,
	folders: Folder[],
	onMoveToRoot: () => void,
	onMoveToParent: () => void,
) {
	return useStable(() => {
		const moveOptions = [];
		const isFolder = "parentId" in item;
		const currentParentId = isFolder ? item.parentId : item.folderId;

		// Add "Move to Root" if item is currently in a folder
		if (currentParentId !== undefined) {
			moveOptions.push({
				key: "move-to-root",
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
				title: `Move to ${parentFolder ? parentFolder.name : "Root"}`,
				onClick: onMoveToParent,
			});
		}

		return moveOptions;
	});
}
