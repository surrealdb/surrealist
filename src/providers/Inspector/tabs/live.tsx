import { Accordion, Badge, Box, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import {
	Icon,
	iconBroadcastOff,
	iconBroadcastOn,
	iconClose,
	iconDelete,
	iconHammer,
	iconHelp,
	iconPlus,
} from "@surrealdb/ui";
import { useEffect, useMemo, useState } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { RelativeTime } from "~/components/RelativeTime";
import { surqlRecordLinks } from "~/editor";
import { getSurrealQL } from "~/screens/surrealist/pages/Connection/connection/connection";
import type { LiveMessage } from "~/types";
import { useInspector } from "..";
import { InspectorSection } from "../components";
import classes from "../style.module.scss";

const LIVE_ACTION_COLORS: Record<string, [string, string]> = {
	CREATE: ["surreal.3", iconPlus],
	UPDATE: ["orange", iconHammer],
	DELETE: ["red", iconDelete],
	KILLED: ["obsidian", iconClose],
};

function hasBody(message: LiveMessage) {
	return message.data !== undefined && message.data !== "killed";
}

function LiveMessageBody({ data, extensions }: { data: any; extensions: any[] }) {
	const [formatted, setFormatted] = useState("");

	useEffect(() => {
		let cancelled = false;

		getSurrealQL()
			.formatValue(data, false, true)
			.then((result) => {
				if (!cancelled) {
					setFormatted(result);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [data]);

	return (
		<CodeEditor
			value={formatted}
			readOnly
			extensions={extensions}
		/>
	);
}

export interface LiveFeedTabProps {
	messages: LiveMessage[];
	liveSupported: boolean;
}

export function LiveFeedTab({ messages, liveSupported }: LiveFeedTabProps) {
	const { inspect } = useInspector();
	const extensions = useMemo(() => [surrealql(), surqlRecordLinks(inspect)], [inspect]);

	return (
		<ScrollArea flex="1 0 0">
			<Box p="md">
				<InspectorSection
					icon={iconBroadcastOn}
					title="Live feed"
					description="Live changes to this record"
					count={messages.length}
				/>

				{messages.length > 0 ? (
					<Accordion
						styles={{
							label: {
								paddingBlock: 8,
							},
						}}
					>
						{messages.map((message) => {
							const [color, icon] = LIVE_ACTION_COLORS[message.action] || [
								"obsidian",
								iconHelp,
							];

							return (
								<Accordion.Item
									key={message.id}
									value={message.id}
								>
									<Accordion.Control pl="xs">
										<Group>
											<Badge
												h={28}
												color={color}
												variant="light"
												leftSection={
													<Icon
														path={icon}
														c={color}
													/>
												}
											>
												<Text
													c={color}
													fw={700}
												>
													{message.action}
												</Text>
											</Badge>
											<RelativeTime value={message.timestamp} />
										</Group>
									</Accordion.Control>
									{hasBody(message) && (
										<Accordion.Panel>
											<LiveMessageBody
												data={message.data}
												extensions={extensions}
											/>
										</Accordion.Panel>
									)}
								</Accordion.Item>
							);
						})}
					</Accordion>
				) : (
					<Paper
						className={classes.emptyList}
						p="lg"
					>
						<Stack
							align="center"
							gap="xs"
						>
							<Icon
								path={liveSupported ? iconBroadcastOn : iconBroadcastOff}
								size="lg"
							/>
							<Text>
								{liveSupported
									? "Waiting for live changes to this record..."
									: "Live queries are not supported by this connection"}
							</Text>
						</Stack>
					</Paper>
				)}
			</Box>
		</ScrollArea>
	);
}
