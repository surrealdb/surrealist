import { ActionIcon, Badge, Box, Center, Group, Paper, ScrollArea, Stack, Text, useMantineTheme } from "@mantine/core";
import { mdiBullhornVariant, mdiCircleDouble, mdiDelete, mdiPencil, mdiPlus } from "@mdi/js";
import { MouseEvent } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { Spacer } from "~/components/Spacer";
import { LIVE_QUERY_COLORS } from "~/constants";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { themeColor } from "~/util/mantine";

export interface QueriesPaneProps {
	activeQueries: string[];
	toggleQuery: (id: string) => void;
	onAddQuery: () => void;
	onEditQuery: (id: string) => void;
	onRemoveQuery: (id: string) => void;
}

export function QueriesPane(props: QueriesPaneProps) {
	const session = useActiveConnection();
	const theme = useMantineTheme();

	const getQueryStyle = useStable((active: boolean) => {
		return {
			borderWidth: 2,
			borderStyle: 'solid',
			borderColor: active ? themeColor('surreal') : 'transparent',
			cursor: 'pointer'
		};
	});

	const handleEdit = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();
		props.onEditQuery(id);
	});

	const handleRemove = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();
		props.onRemoveQuery(id);
	});

	return (
		<Panel
			title="Queries"
			icon={mdiBullhornVariant}
			rightSection={
				<ActionIcon
					title="Add live query"
					onClick={props.onAddQuery}
				>
					<Icon color="light.4" path={mdiPlus} />
				</ActionIcon>
			}
		>
			<ScrollArea
				style={{
					position: "absolute",
					inset: 12,
					top: 4,
				}}
				styles={{
					viewport: {
						'> div': {
							display: 'unset !important'
						}
					}
				}}
			>
				<Stack gap="xs">
					{session.liveQueries.map((query, i) => {
						const isActive = props.activeQueries.includes(query.id);

						return (
							<Paper
								key={i}
								bg="dark.9"
								p="sm"
								c="white"
								py="xs"
								style={getQueryStyle(isActive)}
								onClick={() => props.toggleQuery(query.id)}
								title={isActive ? 'Stop query' : 'Start query'}
							>
								<Group gap="sm" wrap="nowrap">
									<Icon
										path={mdiCircleDouble}
										color={LIVE_QUERY_COLORS[i % LIVE_QUERY_COLORS.length]}
									/>
									<Stack gap={0} miw={0}>
										<Group gap={8}>
											<Text c="gray" size="xs">
												Query {i + 1}
											</Text>
											{isActive && (
												<Box mt={-5}>
													<Badge
														variant="filled"
														size="xs"
													>
														LIVE
													</Badge>
												</Box>
											)}
										</Group>
										<Text truncate>
											{query.name}
										</Text>
									</Stack>
									<Spacer />
									<ActionIcon
										title="Edit query"
										onClick={(e) => handleEdit(e, query.id)}
									>
										<Icon path={mdiPencil} />
									</ActionIcon>
									<ActionIcon
										onClick={(e) => handleRemove(e, query.id)}
									>
										<Icon path={mdiDelete} />
									</ActionIcon>
								</Group>
							</Paper>	
						);
					})}
				</Stack>
			</ScrollArea>

			{session.liveQueries.length === 0 && (
				<Center h="100%" c="light.5">
					No live queries defined yet
				</Center>	
			)}
		</Panel>
	);
}