import {
	iconBroadcastOff,
	iconBroadcastOn,
	iconClose,
	iconCopy,
	iconDelete,
	iconHammer,
	iconHelp,
	iconPlus,
} from "~/util/icons";

import { Accordion, Badge, Center, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { surrealql } from "@surrealdb/codemirror";
import { useContextMenu } from "mantine-contextmenu";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { RelativeTime } from "~/components/RelativeTime";
import { surqlRecordLinks } from "~/editor";
import { useResultFormatter } from "~/hooks/surrealql";
import { useRefreshTimer } from "~/hooks/timer";
import { useInspector } from "~/providers/Inspector";
import { executeQuery } from "~/screens/database/connection/connection";
import { useInterfaceStore } from "~/stores/interface";
import type { LiveMessage } from "~/types";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { type PreviewProps, attemptFormat } from ".";

const LIVE_ACTION_COLORS: Record<string, [string, string]> = {
	CREATE: ["surreal.3", iconPlus],
	UPDATE: ["orange", iconHammer],
	DELETE: ["red", iconDelete],
	CLOSE: ["slate", iconClose],
};

function hasBody(msg: LiveMessage) {
	return msg.data !== undefined && msg.data !== "killed";
}

function killQuery(id: string) {
	executeQuery("KILL $id", { id });

	showNotification({
		title: "Query killed",
		message: "You will no longer receive messages",
	});
}

export function LivePreview({ query, isLive }: PreviewProps) {
	const messages = useInterfaceStore((s) => s.liveQueryMessages[query.id] || []);
	const { inspect } = useInspector();

	const { showContextMenu } = useContextMenu();
	const [format] = useResultFormatter();

	useRefreshTimer(30_000);

	return (
		<>
			{messages.length > 0 ? (
				<ScrollArea
					pos="absolute"
					top={0}
					left={12}
					right={12}
					bottom={12}
				>
					<Accordion
						styles={{
							label: {
								paddingBlock: 8,
							},
						}}
					>
						{messages.map((msg) => {
							const [color, icon] = LIVE_ACTION_COLORS[msg.action] || [
								"slate",
								iconHelp,
							];

							return (
								<Accordion.Item
									key={msg.id}
									value={msg.id}
								>
									<Accordion.Control
										pl="xs"
										onContextMenu={showContextMenu([
											{
												key: "copy",
												title: "Copy live query id",
												icon: <Icon path={iconCopy} />,
												onClick: () =>
													navigator.clipboard.writeText(msg.queryId),
											},
											{
												key: "kill",
												title: "Kill live query",
												icon: <Icon path={iconDelete} />,
												onClick: () => killQuery(msg.queryId),
											},
										])}
									>
										<Group>
											<Badge
												h={28}
												color={color}
												variant="light"
												leftSection={
													<Icon
														path={icon}
														c={color}
														left
													/>
												}
											>
												<Text
													c={color}
													fw={700}
												>
													{msg.action}
												</Text>
											</Badge>
											<Stack gap={0}>
												<RelativeTime value={msg.timestamp} />
												<Text
													c="slate"
													size="xs"
												>
													<Text
														span
														ff="mono"
														onFocus={ON_FOCUS_SELECT}
													>
														{msg.queryId}
													</Text>
												</Text>
											</Stack>
										</Group>
									</Accordion.Control>
									{hasBody(msg) && (
										<Accordion.Panel>
											<CodeEditor
												value={attemptFormat(format, msg.data)}
												readOnly
												extensions={[
													surrealql(),
													surqlRecordLinks(inspect),
												]}
											/>
										</Accordion.Panel>
									)}
								</Accordion.Item>
							);
						})}
					</Accordion>
				</ScrollArea>
			) : (
				<Center
					h="100%"
					c="slate"
				>
					<Stack>
						<Icon
							path={isLive ? iconBroadcastOn : iconBroadcastOff}
							mx="auto"
							size="lg"
						/>
						{isLive
							? "Waiting for live query messages..."
							: "No live queries currently active"}
						{isLive && (
							<Badge
								color="red"
								mx="auto"
							>
								Listening...
							</Badge>
						)}
					</Stack>
				</Center>
			)}
		</>
	);
}
