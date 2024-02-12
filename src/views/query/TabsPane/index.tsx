import classes from "./style.module.scss";
import clsx from "clsx";
import { ActionIcon, Badge, Button, Divider, ScrollArea, Stack, Text } from "@mantine/core";
import { mdiClose, mdiFormatListBulleted, mdiHistory, mdiLightningBolt, mdiPlus, mdiStar } from "@mdi/js";
import { EditableText } from "~/components/EditableText";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";

export interface TabsPaneProps {
	openHistory: () => void;
	openSaved: () => void;
}

export function TabsPane(props: TabsPaneProps) {
	const { addQueryTab, removeQueryTab, updateQueryTab, setActiveQueryTab } = useConfigStore.getState();
	const { queries, activeQuery } = useActiveConnection();
	const isLight = useIsLight();

	const newTab = useStable(() => {
		addQueryTab();
	});

	const removeTab = useStable((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeQueryTab(id);
	});

	const renameQuery = useStable((id: string, name: string) => {
		updateQueryTab({
			id,
			name
		});
	});

	return (
		<ContentPane
			icon={mdiFormatListBulleted}
			title="Queries"
			leftSection={
				<Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{queries.length > 0 && queries.length.toString()}
				</Badge>
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
				<ScrollArea>
					<Stack gap="sm">
						{queries.map((query) => {
							const isActive = query.id === activeQuery;

							return (
								<Button
									key={query.id}
									fullWidth
									miw={0}
									px={8}
									color={isActive ? "surreal": "slate"}
									variant={isActive ? "light" : "subtle"}
									onClick={() => setActiveQueryTab(query.id)}
									className={clsx(classes.query, isActive && classes.queryActive)}
									styles={{
										label: {
											flex: 1
										}
									}}
									leftSection={
										<Icon
											path={mdiLightningBolt}
											color={isActive ? "surreal" : isLight ? "slate.2" : "slate.4"}
										/>
									}
									rightSection={
										queries.length > 1 && (
											<ActionIcon
												component="div"
												className={classes.queryClose}
												onClick={(e) => removeTab(query.id, e)}
											>
												<Icon path={mdiClose} />
											</ActionIcon>
										)
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
								</Button>
							);
						})}
						<Button
							fullWidth
							color="slate"
							variant="light"
							leftSection={<Icon path={mdiPlus} />}
							onClick={newTab}
						>
							New query
						</Button>
					</Stack>
				</ScrollArea>
				<Spacer />
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
						leftSection={<Icon path={mdiStar} />}
						onClick={props.openSaved}
						style={{ flexShrink: 0 }}
					>
						Saved queries
					</Button>
					<Button
						fullWidth
						color="slate"
						variant="light"
						leftSection={<Icon path={mdiHistory} />}
						onClick={props.openHistory}
						style={{ flexShrink: 0 }}
					>
						Query history
					</Button>
				</Stack>
			</Stack>
		</ContentPane>
	);
}