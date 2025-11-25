import { Badge, Box, Center, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { CodeEditor } from "~/components/CodeEditor";
import { ContentPane } from "~/components/Pane";
import { MigrationDiagnosticResult } from "~/types";
import { iconList } from "~/util/icons";
import { severityMeta } from "../MigrationView/severities";

export interface DiagnosticDetailsPanelProps {
	diagnostic: MigrationDiagnosticResult | null;
}

export function DiagnosticDetailsPanel({ diagnostic }: DiagnosticDetailsPanelProps) {
	const severity = diagnostic ? severityMeta[diagnostic.severity] : null;

	return (
		<ContentPane
			title="Details"
			icon={iconList}
		>
			<Box
				h="100%"
				px="sm"
				py="xs"
			>
				{diagnostic ? (
					<ScrollArea
						h="100%"
						pr="sm"
					>
						<Stack
							gap="md"
							pb="lg"
						>
							<Box>
								<Stack gap={6}>
									<Stack gap={4}>
										<Text
											fw={600}
											c="bright"
										>
											{diagnostic.error}
										</Text>
										<Text c="slate">{diagnostic.details}</Text>
									</Stack>
									{severity && (
										<Badge
											color={severity.color}
											size="sm"
											w="fit-content"
											variant="light"
										>
											{severity.label}
										</Badge>
									)}
									{severity && (
										<Text
											c="dimmed"
											size="xs"
										>
											{severity.description}
										</Text>
									)}
								</Stack>
							</Box>

							{diagnostic.location && (
								<Box>
									<Text
										fw={500}
										size="sm"
										c="bright"
										mb={4}
									>
										Location
									</Text>
									<Text
										size="sm"
										c="slate"
									>
										{diagnostic.location.label}
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Line {diagnostic.location.line}, column{" "}
										{diagnostic.location.column}
									</Text>
									{diagnostic.location.source && (
										<Paper p="xs">
											<CodeEditor
												key={JSON.stringify(diagnostic.location)}
												value={JSON.stringify(diagnostic.location, null, 2)}
												extensions={[surrealql()]}
												readOnly
											/>
										</Paper>
									)}
								</Box>
							)}
						</Stack>
					</ScrollArea>
				) : (
					<Center h="100%">
						<Text c="slate">Select a diagnostic to view its details</Text>
					</Center>
				)}
			</Box>
		</ContentPane>
	);
}
