import { Center, Text } from "@mantine/core";
import { Accordion, Badge, Group, ScrollArea, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { surrealql } from "@surrealdb/codemirror";
import { useContextMenu } from "mantine-contextmenu";
import { tryit } from "radash";
import { useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { surqlRecordLinks } from "~/editor";
import { type Formatter, useValueFormatter } from "~/hooks/surrealql";
import { useRelativeTime } from "~/hooks/time";
import { useRefreshTimer } from "~/hooks/timer";
import { useInspector } from "~/providers/Inspector";
import { executeQuery } from "~/screens/database/connection/connection";
import { useInterfaceStore } from "~/stores/interface";
import type { LiveMessage, TabQuery } from "~/types";
import { ON_FOCUS_SELECT } from "~/util/helpers";
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

const LIVE_ACTION_COLORS: Record<string, [string, string]> = {
	CREATE: ["surreal.3", iconPlus],
	UPDATE: ["orange", iconHammer],
	DELETE: ["red", iconDelete],
	CLOSE: ["slate", iconClose],
};

function hasBody(msg: LiveMessage) {
	return msg.data !== undefined && msg.data !== "killed";
}

function attemptFormat(format: Formatter, data: any) {
	const [err, res] = tryit(format)(data);

	return err ? `"Error: ${err.message}"` : res;
}

function buildCombinedResult(
	index: number,
	{ result, execution_time }: any,
	format: Formatter,
) {
	const header = `\n\n-------- Query ${index + 1 + (execution_time ? ` (${execution_time})` : "")} --------\n\n`;

	return header + attemptFormat(format, result);
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
	const [format] = useValueFormatter();
	const { inspect } = useInspector();

	const contents = useMemo(() => {
		return results
			.reduce(
				(acc, cur, i) => acc + buildCombinedResult(i, cur, format),
				"",
			)
			.trim();
	}, [results, format]);

	return (
		<CodeEditor
			value={contents}
			readOnly
			extensions={[
				surrealql("combined-results"),
				surqlRecordLinks(inspect),
			]}
		/>
	);
}

export interface SingleJsonPreviewProps {
	result: any;
}

export function SingleJsonPreview({ result }: SingleJsonPreviewProps) {
	const [format] = useValueFormatter();
	const { inspect } = useInspector();
	const contents = useMemo(
		() => attemptFormat(format, result),
		[result, format],
	);

	return (
		<CodeEditor
			value={contents}
			readOnly
			extensions={[surrealql(), surqlRecordLinks(inspect)]}
		/>
	);
}

export interface LivePreviewProps {
	query: TabQuery;
	isLive: boolean;
}

export function LivePreview({ query, isLive }: LivePreviewProps) {
	const messages = useInterfaceStore(
		(s) => s.liveQueryMessages[query.id] || [],
	);
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
								paddingBlock: 8,
							},
						}}
					>
						{messages.map((msg) => {
							const [color, icon] = LIVE_ACTION_COLORS[
								msg.action
							] || ["slate", iconHelp];

							return (
								<Accordion.Item key={msg.id} value={msg.id}>
									<Accordion.Control
										pl="xs"
										onContextMenu={showContextMenu([
											{
												key: "copy",
												title: "Copy live query id",
												icon: <Icon path={iconCopy} />,
												onClick: () =>
													navigator.clipboard.writeText(
														msg.queryId,
													),
											},
											{
												key: "kill",
												title: "Kill live query",
												icon: (
													<Icon path={iconDelete} />
												),
												onClick: () =>
													killQuery(msg.queryId),
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
												<Text c={color} fw={700}>
													{msg.action}
												</Text>
											</Badge>
											<Stack gap={0}>
												<Text>
													{formatTime(msg.timestamp)}
												</Text>
												<Text c="slate" size="xs">
													<Text
														span
														ff="mono"
														onFocus={
															ON_FOCUS_SELECT
														}
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
												value={attemptFormat(
													format,
													msg.data,
												)}
												readOnly
												extensions={[surrealql()]}
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
							: "No live queries currently active"}
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
