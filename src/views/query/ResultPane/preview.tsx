import { Center, Text } from "@mantine/core";
import { Accordion, Badge, Group, ScrollArea, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { useRelativeTime } from "~/hooks/time";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { TabQuery } from "~/types";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { iconBroadcastOff, iconBroadcastOn, iconCopy, iconDelete, iconHammer, iconHelp, iconPlus } from "~/util/icons";
import { getSurreal } from "~/util/surreal";

const LIVE_ACTION_COLORS: Record<string, [string, string]> = {
	create: ["surreal.3", iconPlus],
	update: ["orange", iconHammer],
	delete: ["red", iconDelete],
};

function buildResult(index: number, {result, time}: any) {
	const header = `\n\n// -------- Query ${index + 1 + (time ? ` (${time})` : '')} --------\n\n`;
	const content = JSON.stringify(result, null, 4);

	return header + content;
}

function killQuery(id: string) {
	getSurreal()?.query("KILL $id", { id });

	showNotification({
		title: "Query killed",
		message: "You will no longer receive messages",
	});
}

export interface CombinedJsonPreviewProps {
	results: any[];
}

export function CombinedJsonPreview({ results }: CombinedJsonPreviewProps) {
	const wordWrap = useConfigStore((s) => s.wordWrap);

	const contents = useMemo(() => {
		return results.reduce((acc, cur, i) => acc + buildResult(i, cur), '').trim();
	}, [results]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off"
			}}
		/>
	);
}

export interface SingleJsonPreviewProps {
	result: any;
}

export function SingleJsonPreview({ result }: SingleJsonPreviewProps) {
	const wordWrap = useConfigStore((s) => s.wordWrap);

	const contents = useMemo(() => {
		return JSON.stringify(result, null, 4);
	}, [result]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off"
			}}
		/>
	);
}

export interface LivePreviewProps {
	query: TabQuery;
	isLive: boolean;
}

export function LivePreview({ query, isLive }: LivePreviewProps) {
	const messages = useInterfaceStore((s) => s.liveQueryMessages[query.id] || []);
	const format = useRelativeTime();

	const { showContextMenu } = useContextMenu();

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
												<Text c="slate" size="xs">
													{format(msg.timestamp)}
												</Text>
												<Text>
													Query <Text span ff="mono" onFocus={ON_FOCUS_SELECT}>{msg.queryId}</Text>
												</Text>
											</Stack>
										</Group>
									</Accordion.Control>
									{msg.data !== undefined && (
										<Accordion.Panel>
											<SurrealistEditor
												autoSize
												language="json"
												value={JSON.stringify(msg.data, null, 4)}
												options={{
													readOnly: true
												}}
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