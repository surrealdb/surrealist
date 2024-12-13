import classes from "./style.module.scss";

import {
	iconArrowUpRight,
	iconChevronLeft,
	iconChevronRight,
	iconClose,
	iconCopy,
	iconFile,
	iconHistory,
	iconList,
	iconPlus,
	iconQuery,
	iconSearch,
	iconStar,
	iconText,
} from "~/util/icons";

import {
	ActionIcon,
	Badge,
	type BoxProps,
	Divider,
	type ElementProps,
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
import { useBoolean } from "~/hooks/boolean";
import { useSetting } from "~/hooks/config";
import { useActiveConnection } from "~/hooks/connection";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { cancelLiveQueries } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type { QueryTab, QueryType } from "~/types";
import { uniqueName } from "~/util/helpers";

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
		const existing = queries.filter((q) => q.id !== id).map((q) => q.name ?? "");
		const name = uniqueName(newName || "New query", existing);

		updateQueryTab({
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
				addQueryTab({
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

					{queries.length > 1 && queryQuickClose && (
						<ActionButton
							size="sm"
							variant="transparent"
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

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

export function TabsPane(props: TabsPaneProps) {
	const { removeQueryState } = useQueryStore.getState();
	const { updateCurrentConnection, addQueryTab, removeQueryTab, setActiveQueryTab } =
		useConfigStore.getState();

	const { queries, activeQuery } = useActiveConnection();
	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isLight = useIsLight();

	const newTab = useStable(() => {
		addQueryTab({ type: "config" });
	});

	const removeTab = useStable((id: string) => {
		removeQueryTab(id);
		cancelLiveQueries(id);
		removeQueryState(id);

		if (adapter instanceof DesktopAdapter) {
			adapter.pruneQueryFiles();
		}
	});

	const saveQueryOrder = useStable((queries: QueryTab[]) => {
		updateCurrentConnection({
			queries,
		});
	});

	const closeQueryList = useStable(() => {
		updateCurrentConnection({
			queryTabList: false,
		});
	});

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
					{queries.length}
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
						<Sortable
							items={queries}
							direction="vertical"
							constraint={{ distance: 10 }}
							onSorted={saveQueryOrder}
						>
							{({ item: query, handleProps, isDragging }) => {
								const isActive = query.id === activeQuery;
								const isLive = liveTabs.has(query.id);

								return (
									<Query
										key={query.id}
										query={query}
										queries={queries}
										isActive={isActive}
										isLive={isLive}
										isDragging={isDragging}
										onActivate={setActiveQueryTab}
										onRemoveQuery={removeTab}
										{...handleProps}
									/>
								);
							}}
						</Sortable>
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
