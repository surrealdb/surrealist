import { Box, Group, Paper, Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import dayjs from "dayjs";
import type { Uuid } from "surrealdb";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { executeQuerySingle } from "~/screens/surrealist/connection/connection";
import { showErrorNotification } from "~/util/helpers";
import { iconCircleFilled } from "~/util/icons";

interface Node {
	seen: number;
	active: boolean;
	id: Uuid;
}

export async function showNodeStatus() {
	try {
		const { nodes } = await executeQuerySingle<{ nodes: Node[] }>("INFO FOR ROOT STRUCTURE");
		const single = nodes.length === 1;

		openModal({
			title: <PrimaryTitle>Node status</PrimaryTitle>,
			withCloseButton: true,
			styles: { header: { paddingBottom: 0 } },
			size: "lg",
			children: (
				<Stack>
					<Text>
						There {single ? "is" : "are"} {nodes.length} node{single ? "" : "s"}{" "}
						registered in the current cluster
					</Text>
					<Stack mt="md">
						{nodes.map((node) => (
							<Paper
								bg="slate.7"
								key={node.id.toString()}
								p="md"
							>
								<Group>
									<Icon
										color={node.active ? "green" : "red"}
										path={iconCircleFilled}
										size="xl"
									/>
									<Box>
										<Text
											c="bright"
											ff="monospace"
										>
											Node ID:{" "}
											<Text
												span
												style={{
													userSelect: "text",
													WebkitUserSelect: "text",
												}}
											>
												{node.id.toString()}
											</Text>
										</Text>
										<Text>
											{node.active ? "Online" : "Offline"} - Last seen{" "}
											{dayjs(node.seen).fromNow()}
										</Text>
									</Box>
								</Group>
							</Paper>
						))}
					</Stack>
				</Stack>
			),
		});
	} catch (err: any) {
		console.warn("Failed to retrieve node status", err);

		showErrorNotification({
			title: "Failed to retrieve node status",
			content: err,
		});
	}
}
