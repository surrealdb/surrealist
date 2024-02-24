import classes from "./style.module.scss";
import { ActionIcon, Badge, Button, Divider, ScrollArea, Stack, Text } from "@mantine/core";
import { EditableText } from "~/components/EditableText";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { LiveIndicator } from "~/components/LiveIndicator";
import { getSurreal } from "~/util/surreal";
import { iconArrowUpRight, iconClose, iconCopy, iconHistory, iconList, iconPlus, iconQuery, iconStar } from "~/util/icons";
import { Entry } from "~/components/Entry";
import { useContextMenu } from "mantine-contextmenu";
import { TabQuery } from "~/types";
import { Sortable } from "~/components/Sortable";

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

export function TabsPane(props: TabsPaneProps) {
	const { updateCurrentConnection, addQueryTab, removeQueryTab, updateQueryTab, setActiveQueryTab } = useConfigStore.getState();
	const { queries, activeQuery } = useActiveConnection();
	const { showContextMenu } = useContextMenu();
	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isLight = useIsLight();

	const newTab = useStable(() => {
		addQueryTab();
	});

	const removeTab = useStable((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeQueryTab(id);
		getSurreal()?.cancelQueries(id);
	});

	const renameQuery = useStable((id: string, name: string) => {
		updateQueryTab({
			id,
			name
		});
	});

	const saveQueryOrder = useStable((queries: TabQuery[]) => {
		updateCurrentConnection({
			queries
		});
	});

	const duplicateQuery = ({ query, name, variables }: TabQuery) => {
		addQueryTab({
			name: name?.replace(/ \d+$/, ""),
			query,
			variables
		});
	};

	return (
		<ContentPane
			icon={iconList}
			title="Queries"
			w={325}
			leftSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{queries.length}
				</Badge>
			}
			rightSection={
				<ActionIcon title="Create query..." onClick={newTab}>
					<Icon path={iconPlus} />
				</ActionIcon>
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
				<ScrollArea flex={1}>
					<Stack gap="xs" pb="md">
						<Sortable
							items={queries}
							direction="vertical"
							constraint={{ distance: 10 }}
							onSorted={saveQueryOrder}
						>
							{({ item: query, handleProps }) => {
								const isActive = query.id === activeQuery;
								const isLive = liveTabs.has(query.id);
	
								return (
									<Entry
										key={query.id}
										isActive={isActive}
										onClick={() => setActiveQueryTab(query.id)}
										className={classes.query}
										onContextMenu={showContextMenu([
											{
												key: "open",
												title: "Open query",
												icon: <Icon path={iconArrowUpRight} />,
												onClick: () => setActiveQueryTab(query.id)
											},
											{
												key: "duplicate",
												title: "Duplicate query",
												icon: <Icon path={iconCopy} />,
												onClick: () => duplicateQuery(query)
											}
										])}
										leftSection={
											<Icon path={iconQuery} {...handleProps} />
										}
										rightSection={
											<>
												{isLive && (
													<LiveIndicator
														className={classes.queryLive}
														mr={-4}
													/>
												)}
	
												{queries.length > 1 && (
													<ActionIcon
														component="div"
														className={classes.queryClose}
														onClick={(e) => removeTab(query.id, e)}
														color={(isActive && isLight) ? "white" : undefined}
														bg={isActive ? "rgba(255, 255, 255, 0.15)" : undefined}
													>
														<Icon path={iconClose} />
													</ActionIcon>
												)}
											</>
										}
									>
										<EditableText
											value={query.name || ''}
											onChange={(value) => renameQuery(query.id, value)}
											withDoubleClick
											withDecoration
											style={{
												outline: 'none',
											}}
										/>
									</Entry>
								);
							}}
						</Sortable>
					</Stack>
				</ScrollArea>
				<Divider mb="xs" />
				<Stack>
					<Text
						c="slate"
						fz="lg"
						fw={500}
					>
						Actions
					</Text>
					<Button
						fullWidth
						color="slate"
						variant="light"
						leftSection={<Icon path={iconStar} />}
						onClick={props.openSaved}
					>
						Saved queries
					</Button>
					<Button
						fullWidth
						color="slate"
						variant="light"
						leftSection={<Icon path={iconHistory} />}
						onClick={props.openHistory}
					>
						Query history
					</Button>
				</Stack>
			</Stack>
		</ContentPane>
	);
}