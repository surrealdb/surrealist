import { Button, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import type { QueryFolder, QueryTab } from "~/types";
import { iconArrowLeft, iconFolder, iconHome } from "~/util/icons";
import classes from "./style.module.scss";

export interface FileExplorerProps {
	opened: boolean;
	onClose: () => void;
	title: string;
	description: string;
	folders: QueryFolder[];
	queries: QueryTab[];
	initialPath?: string[];
	excludedFolderIds?: string[];
	onMove: (targetFolderId?: string) => void;
}

export function FileExplorer({
	opened,
	onClose,
	title,
	description,
	folders,
	queries,
	initialPath = [],
	excludedFolderIds = [],
	onMove,
}: FileExplorerProps) {
	const [browserPath, setBrowserPath] = useState<string[]>(initialPath);

	// Reset path when modal opens with new initial path
	useState(() => {
		if (opened) {
			setBrowserPath(initialPath);
		}
	});

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

	// Get folders in current browser location (excluding excluded folders)
	const currentBrowserFolders = folders
		.filter((f) => f.parentId === currentBrowserFolderId && !excludedFolderIds.includes(f.id))
		.sort((a, b) => a.order - b.order);

	// Get queries in current browser location for context (greyed out)
	const currentBrowserQueries = queries
		.filter((q) => q.folderId === currentBrowserFolderId)
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
					{/* Back button */}
					{browserPath.length > 0 && (
						<ActionButton
							label="Back"
							onClick={navigateBrowserBack}
							size="sm"
						>
							<Icon path={iconArrowLeft} />
						</ActionButton>
					)}

					{/* Home button */}
					<ActionButton
						label="Root"
						onClick={() => setBrowserPath([])}
						size="sm"
					>
						<Icon path={iconHome} />
					</ActionButton>

					{/* Breadcrumb */}
					<div className={classes.breadcrumb}>
						<span>Root</span>
						{browserBreadcrumbs.map((folder, index) => (
							<span
								key={folder.id}
								className={classes.breadcrumbItem}
							>
								<span>/</span>
								<button
									type="button"
									onClick={() => navigateToBreadcrumb(index)}
									className={classes.breadcrumbLink}
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
						{currentBrowserFolders.map((folder) => (
							<Button
								key={folder.id}
								variant="subtle"
								leftSection={<Icon path={iconFolder} />}
								fullWidth
								justify="flex-start"
								onClick={() => navigateToBrowserFolder(folder.id)}
								className={classes.folderItem}
							>
								{folder.name}
							</Button>
						))}

						{/* Queries (greyed out for context) */}
						{currentBrowserQueries.map((query) => (
							<Button
								key={query.id}
								variant="subtle"
								leftSection={<Icon path={query.type} />}
								fullWidth
								justify="flex-start"
								disabled
								className={classes.queryItem}
							>
								{query.name || "Untitled"}
							</Button>
						))}

						{/* Empty state */}
						{currentBrowserFolders.length === 0 &&
							currentBrowserQueries.length === 0 && (
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
