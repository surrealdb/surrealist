import { Box, Button, Divider, Group, Paper, ScrollArea, Stack, Text, Title } from "@mantine/core";
import {
	CodeBlock,
	Icon,
	iconBug,
	iconCheck,
	iconCopy,
	iconCursor,
	iconWarning,
} from "@surrealdb/ui";
import type { FallbackProps } from "react-error-boundary";
import { adapter } from "~/adapter";
import { useVersionCopy } from "~/hooks/debug";
import { useIsLight } from "~/hooks/theme";

export function ScaffoldErrorHandler({ error, resetErrorBoundary }: FallbackProps) {
	const [copyDebug, clipboard] = useVersionCopy();
	const isLight = useIsLight();

	const message = error instanceof Error ? error.message : error;

	return (
		<ScrollArea
			h="100%"
			bg={isLight ? "obsidian.0" : "obsidian.9"}
		>
			<Paper
				p="xl"
				maw={800}
				mx="auto"
				my={75}
			>
				<Stack gap="lg">
					<Group c="bright">
						<Icon
							path={iconWarning}
							size="lg"
						/>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Surrealist encountered an error
						</Text>
					</Group>

					<Text>
						You can find a detailed error message below. If you believe this is a bug,
						please report it on our GitHub repository.
					</Text>

					<Group>
						<Button
							leftSection={<Icon path={iconCursor} />}
							onClick={resetErrorBoundary}
							variant="light"
							color="obsidian"
							radius="xs"
							size="xs"
						>
							Reload Surrealist
						</Button>
						<Button
							leftSection={<Icon path={iconBug} />}
							onClick={() =>
								adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
							}
							variant="light"
							color="obsidian"
							radius="xs"
							size="xs"
						>
							File an issue
						</Button>
						<Button
							leftSection={<Icon path={clipboard.copied ? iconCheck : iconCopy} />}
							onClick={copyDebug}
							variant="light"
							color="obsidian"
							radius="xs"
							size="xs"
						>
							{clipboard.copied ? "Copied!" : "Copy version information"}
						</Button>
					</Group>

					<Divider />

					{message && (
						<Box>
							<Title order={3}>Message</Title>

							<CodeBlock value={message} />
						</Box>
					)}

					{error.cause && (
						<Box>
							<Title order={3}>Cause</Title>

							<CodeBlock value={error.cause} />
						</Box>
					)}

					{error.stack && (
						<Box>
							<Title order={3}>Stack trace</Title>

							<CodeBlock value={error.stack} />
						</Box>
					)}
				</Stack>
			</Paper>
		</ScrollArea>
	);
}
