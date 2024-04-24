import { Center, Text } from "@mantine/core";
import { Accordion, Badge, Group, ScrollArea, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { CodeEditor } from "~/components/CodeEditor";
import { useRelativeTime } from "~/hooks/time";
import { useInterfaceStore } from "~/stores/interface";
import { TabQuery } from "~/types";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { iconBroadcastOff, iconBroadcastOn, iconCopy, iconDelete, iconHammer, iconHelp, iconPlus } from "~/util/icons";
import { executeQuery } from "~/connection";
import { Formatter, useValueFormatter } from "~/hooks/surrealql";
import { useRefreshTimer } from "~/hooks/timer";
import { surrealql } from "codemirror-surrealql";

const LIVE_ACTION_COLORS: Record<string, [string, string]> = {
	'CREATE': ["surreal.3", iconPlus],
	'UPDATE': ["orange", iconHammer],
	'DELETE': ["red", iconDelete],
};

function buildResult(index: number, {result, execution_time}: any, format: Formatter) {
	const header = `\n\n-------- Query ${index + 1 + (execution_time ? ` (${execution_time})` : '')} --------\n\n`;

	return header + format(result);
}

function killQuery(id: string) {
	executeQuery("KILL $id", { id });

	showNotification({
		title: "Query killed",
		message: "You will no longer receive messages",
	});
}

export interface CombinedJsonPreviewProps {
	results: any[];
}

export function CombinedJsonPreview({ results }: CombinedJsonPreviewProps) {
	const [format, mode] = useValueFormatter();

	const contents = useMemo(() => {
		return results.reduce((acc, cur, i) => acc + buildResult(i, cur, format), '').trim();
	}, [results, mode]);

	return (
		<CodeEditor
			value={contents}
			readOnly
			extensions={[
				surrealql()
			]}
		/>
	);
}

export interface SingleJsonPreviewProps {
	result: any;
}

export function SingleJsonPreview({ result }: SingleJsonPreviewProps) {
	const [format, mode] = useValueFormatter();
	const contents = useMemo(() => format(result), [result, mode]);

	return (
		<CodeEditor
			value={contents}
			readOnly
			extensions={[
				surrealql()
			]}
		/>
	);
}

export interface LivePreviewProps {
	query: TabQuery;
	isLive: boolean;
}

export function LivePreview({ query, isLive }: LivePreviewProps) {
	const messages = useInterfaceStore((s) => s.liveQueryMessages[query.id] || []);
	const formatTime = useRelativeTime();

	const { showContextMenu } = useContextMenu();
	const [format] = useValueFormatter();

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
								paddingBlock: 8
							}
						}}
					>
						{messages.map(msg => {
							const [color, icon] = LIVE_ACTION_COLORS[msg.action] || ["slate", iconHelp];

							return (
								<Accordion.Item key={msg.id} value={msg.id}>
									<Accordion.Control
										pl="xs"
										onContextMenu={showContextMenu([
											{
												key: "copy",
												title: "Copy live query id",
												icon: <Icon path={iconCopy} />,
												onClick: () => navigator.clipboard.writeText(msg.queryId)
											},
											{
												key: "kill",
												title: "Kill live query",
												icon: <Icon path={iconDelete} />,
												onClick: () => killQuery(msg.queryId)
											}
										])}
									>
										<Group>
											<Badge
												py="xs"
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
												<Text c={color} fw={700}>
													{msg.action}
												</Text>
											</Badge>
											<Stack gap={0}>
												<Text>
													{formatTime(msg.timestamp)}
												</Text>
												<Text c="slate" size="xs">
													<Text span ff="mono" onFocus={ON_FOCUS_SELECT}>{msg.queryId}</Text>
												</Text>
											</Stack>
										</Group>
									</Accordion.Control>
									{msg.data !== undefined && (
										<Accordion.Panel>
											<CodeEditor
												value={format(msg.data)}
												readOnly
												extensions={[
													surrealql()
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
				<Center h="100%" c="slate">
					<Stack>
						<Icon
							path={isLive ? iconBroadcastOn : iconBroadcastOff}
							mx="auto"
							size="lg"
						/>
						{isLive
							? "Waiting for live query messages..."
							: "No live queries currently active"
						}
						{isLive && (
							<Badge color="red" mx="auto">
								Listening...
							</Badge>
						)}
					</Stack>
				</Center>
			)}
		</>
	);
}