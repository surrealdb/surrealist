import { Button, Center, Group, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import type { QueryFolder, QueryTab } from "~/types";
import { sortItemsByTimestamp } from "~/util/helpers";
import { iconArrowLeft, iconFolder, iconHome } from "~/util/icons";
import { TYPE_ICONS } from "../helpers";
import classes from "./style.module.scss";

export interface MoveModalProps {
	opened: boolean;
	onClose: () => void;
	title: string;
	description: string;
	folders: QueryFolder[];
	queries: QueryTab[];
	initialPath?: string[];
	excludedFolderIds?: string[];
	movingQueryId?: string;
	movingFolderId?: string;
	onMove: (targetFolderId?: string) => void;
}

export function MoveModal({
	opened,
	onClose,
	title,
	description,
	folders,
	queries,
	initialPath = [],
	excludedFolderIds = [],
	movingQueryId,
	movingFolderId,
	onMove,
}: MoveModalProps) {
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
	const currentBrowserFolders = sortItemsByTimestamp(
		folders.filter((f) => f.parentId === currentBrowserFolderId),
	);

	// Get queries in current browser location for context (greyed out)
	const currentBrowserQueries = sortItemsByTimestamp(
		queries.filter((query) => query.parentId === currentBrowserFolderId),
	);

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
			centered
		>
			<Stack gap="md">
				<Text
					size="sm"
					c="dimmed"
				>
					{description}
				</Text>

				{/* Browser Navigation */}
				<Group
					className={classes.navigation}
					gap="lg"
					mb="xs"
				>
					<Group
						className={classes.navigationButtons}
						gap="xs"
						style={{ flexShrink: 0 }}
					>
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
					</Group>

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
				</Group>

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

						{/* Queries (greyed out for context) */}
						{currentBrowserQueries.map((query) => {
							const isMovingQuery = movingQueryId === query.id;
							return (
								<Button
									key={query.id}
									variant="subtle"
									leftSection={<Icon path={TYPE_ICONS[query.queryType]} />}
									fullWidth
									justify="flex-start"
									disabled
									className={classes.queryItem}
								>
									{query.name || "Untitled"}
									{isMovingQuery && " (moving)"}
								</Button>
							);
						})}

						{/* Empty state */}
						{currentBrowserFolders.length === 0 &&
							currentBrowserQueries.length === 0 && (
								<Center className={classes.emptyState}>
									<Text
										size="sm"
										c="slate"
									>
										This location is empty
									</Text>
								</Center>
							)}
					</Stack>
				</ScrollArea.Autosize>

				{/* Action Buttons */}
				<Group
					justify="flex-end"
					gap="sm"
					mt="md"
				>
					<Button
						variant="subtle"
						onClick={handleClose}
					>
						Cancel
					</Button>
					<Button
						variant="gradient"
						onClick={handleMove}
					>
						Move Here
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
