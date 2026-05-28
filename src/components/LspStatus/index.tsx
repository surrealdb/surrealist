import { Group, type MantineColor, Popover, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Spacer } from "~/components/Spacer";
import { getSharedSurqlLspClient, onLiveMetadataCount } from "~/editor/lsp";
import { useSetting } from "~/hooks/config";
import classes from "./style.module.scss";

interface LogEntry {
	id: number;
	level: number;
	message: string;
	timestamp: number;
}

const MAX_LOG_ENTRIES = 50;

let nextLogId = 0;

/**
 * Status indicator for the SurrealQL language server.
 *
 * Renders an action-button pill in the top action bar showing whether
 * the server is initialising, ready, or has reported errors. Clicking
 * opens a popover with the most recent log messages and the live
 * define count from the metadata pump.
 */
export function LspStatus() {
	const [enabled] = useSetting("behavior", "useLanguageServer");
	const [ready, setReady] = useState(false);
	const [defineCount, setDefineCount] = useState(0);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [hasError, setHasError] = useState(false);

	const client = useMemo(() => (enabled ? getSharedSurqlLspClient() : null), [enabled]);

	useEffect(() => {
		if (!client) {
			setReady(false);
			setHasError(false);
			setLogs([]);
			return;
		}

		let alive = true;

		client.ensureInitialized().then(() => {
			if (alive) setReady(true);
		});

		const offLog = client.onLog((level, message) => {
			if (!alive) return;
			setLogs((prev) => {
				const next = [...prev, { id: nextLogId++, level, message, timestamp: Date.now() }];
				return next.length > MAX_LOG_ENTRIES
					? next.slice(next.length - MAX_LOG_ENTRIES)
					: next;
			});
			if (level === 1) setHasError(true);
		});

		const offMetadata = onLiveMetadataCount((count) => {
			if (alive) setDefineCount(count);
		});

		return () => {
			alive = false;
			offLog();
			offMetadata();
		};
	}, [client]);

	if (!enabled) {
		return null;
	}

	const _tone: MantineColor | undefined = hasError ? "red" : ready ? undefined : "yellow";

	return (
		<Popover
			position="bottom-end"
			width={360}
			shadow="md"
			withArrow
		>
			<Popover.Dropdown p="md">
				<Stack gap="xs">
					<Group gap="xs">
						<Text fw={600}>SurrealQL language server</Text>
						<Spacer />
						<Text
							size="sm"
							className="selectable"
						>
							{defineCount} defines
						</Text>
					</Group>
					<Text
						size="sm"
						className="selectable"
					>
						{ready
							? "The language server is running and powering completions, hover, and diagnostics in the query editor."
							: "Initialising the language server worker…"}
					</Text>
					<Text
						fw={600}
						size="sm"
						mt="xs"
					>
						Recent log messages
					</Text>
					{logs.length === 0 ? (
						<Text size="sm">No log messages yet.</Text>
					) : (
						<ScrollArea
							h={180}
							type="auto"
						>
							<Stack
								gap={4}
								className="selectable"
							>
								{logs
									.slice()
									.reverse()
									.map((entry) => (
										<Text
											key={entry.id}
											size="xs"
											ff="monospace"
											className={classes.logEntry}
											data-level={entry.level}
										>
											{entry.message}
										</Text>
									))}
							</Stack>
						</ScrollArea>
					)}
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}
