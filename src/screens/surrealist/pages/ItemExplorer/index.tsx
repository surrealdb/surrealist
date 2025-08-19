import { Button, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import type { Folder, OrganizableItem } from "~/types";
import { iconArrowLeft, iconFolder, iconHome } from "~/util/icons";
import classes from "./style.module.scss";

export interface ItemExplorerProps<
	TFolder extends Folder = Folder,
	TItem extends OrganizableItem = OrganizableItem,
> {
	opened: boolean;
	onClose: () => void;
	title: string;
	description: string;
	folders: TFolder[];
	items: TItem[];
	initialPath?: string[];
	excludedFolderIds?: string[];
	movingItemId?: string;
	movingFolderId?: string;
	onMove: (targetFolderId?: string) => void;
	// Function to get the icon for an item
	getItemIcon: (item: TItem) => string;
	// Function to get the display name for an item
	getItemName: (item: TItem) => string;
}

export function ItemExplorer<
	TFolder extends Folder = Folder,
	TItem extends OrganizableItem = OrganizableItem,
>({
	opened,
	onClose,
	title,
	description,
	folders,
	items,
	initialPath = [],
	excludedFolderIds = [],
	movingItemId,
	movingFolderId,
	onMove,
	getItemIcon,
	getItemName,
}: ItemExplorerProps<TFolder, TItem>) {
	const [browserPath, setBrowserPath] = useState<string[]>(initialPath);

	// Reset path when modal opens with new initial path
	useEffect(() => {
		if (opened) {
			setBrowserPath(initialPath);
		}
	}, [opened, initialPath]);

	const handleClose = () => {
		setBrowserPath([]);
		onClose();
	};

	const handleMove = () => {
		const currentBrowserFolderId =
			browserPath.length > 0 ? browserPath[browserPath.length - 1] : undefined;
		onMove(currentBrowserFolderId);
		handleClose();
	};

	// Get current folder ID from browser path
	const currentBrowserFolderId =
		browserPath.length > 0 ? browserPath[browserPath.length - 1] : undefined;

	// Get folders in current browser location
	const currentBrowserFolders = folders
		.filter((f) => f.parentId === currentBrowserFolderId)
		.sort((a, b) => a.order - b.order);

	// Get items in current browser location for context (greyed out)
	const currentBrowserItems = items
		.filter((item) => item.folderId === currentBrowserFolderId)
		.sort((a, b) => a.order - b.order);

	// Build breadcrumb path for browser
	const browserBreadcrumbs = browserPath
		.map((folderId) => folders.find((f) => f.id === folderId))
		.filter((folder): folder is NonNullable<typeof folder> => folder !== undefined);

	// Navigate to folder in browser
	const navigateToBrowserFolder = (folderId: string) => {
		setBrowserPath([...browserPath, folderId]);
	};

	// Navigate back in browser
	const navigateBrowserBack = () => {
		setBrowserPath(browserPath.slice(0, -1));
	};

	// Navigate to specific breadcrumb
	const navigateToBreadcrumb = (index: number) => {
		setBrowserPath(browserPath.slice(0, index + 1));
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={title}
			size="lg"
		>
			<Stack gap="md">
				<Text
					size="sm"
					c="dimmed"
				>
					{description}
				</Text>

				{/* Browser Navigation */}
				<div className={classes.navigation}>
					<div className={classes.navigationButtons}>
						{/* Back button */}
						{browserPath.length > 0 && (
							<ActionButton
								label="Back"
								onClick={navigateBrowserBack}
								size="md"
							>
								<Icon path={iconArrowLeft} />
							</ActionButton>
						)}

						{/* Home button */}
						<ActionButton
							label="Root"
							onClick={() => setBrowserPath([])}
							size="md"
						>
							<Icon path={iconHome} />
						</ActionButton>
					</div>

					{/* Breadcrumb Path */}
					<div className={classes.breadcrumbPath}>
						<span className={classes.breadcrumbRoot}>Root</span>
						{browserBreadcrumbs.map((folder, index) => (
							<span
								key={folder.id}
								className={classes.breadcrumbItem}
							>
								<span className={classes.breadcrumbSeparator}>/</span>
								<button
									type="button"
									onClick={() => navigateToBreadcrumb(index)}
									className={classes.breadcrumbLink}
									title={`Navigate to ${folder.name}`}
								>
									{folder.name}
								</button>
							</span>
						))}
					</div>
				</div>

				{/* Browser Content */}
				<ScrollArea.Autosize className={classes.content}>
					<Stack className={classes.folderList}>
						{/* Folders */}
						{currentBrowserFolders.map((folder) => {
							const isMovingFolder = movingFolderId === folder.id;
							const isExcludedFolder = excludedFolderIds.includes(folder.id);
							const isDisabled = isMovingFolder || isExcludedFolder;
							return (
								<Button
									key={folder.id}
									variant="subtle"
									leftSection={<Icon path={iconFolder} />}
									fullWidth
									justify="flex-start"
									onClick={
										isDisabled
											? undefined
											: () => navigateToBrowserFolder(folder.id)
									}
									disabled={isDisabled}
									className={classes.folderItem}
								>
									{folder.name}
									{isMovingFolder && " (moving)"}
								</Button>
							);
						})}

						{/* Items (greyed out for context) */}
						{currentBrowserItems.map((item) => {
							const isMovingItem = movingItemId === item.id;
							return (
								<Button
									key={item.id}
									variant="subtle"
									leftSection={<Icon path={getItemIcon(item)} />}
									fullWidth
									justify="flex-start"
									disabled
									className={classes.itemItem}
								>
									{getItemName(item)}
									{isMovingItem && " (moving)"}
								</Button>
							);
						})}

						{/* Empty state */}
						{currentBrowserFolders.length === 0 && currentBrowserItems.length === 0 && (
							<Text
								size="sm"
								c="dimmed"
								className={classes.emptyState}
							>
								This location is empty
							</Text>
						)}
					</Stack>
				</ScrollArea.Autosize>

				{/* Action Buttons */}
				<div className={classes.actions}>
					<Button
						variant="subtle"
						onClick={handleClose}
					>
						Cancel
					</Button>
					<Button onClick={handleMove}>Move Here</Button>
				</div>
			</Stack>
		</Modal>
	);
}
