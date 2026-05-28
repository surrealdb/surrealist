import {
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Loader,
	type MantineColor,
	Popover,
	ScrollArea,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { Icon, iconErrorCircle, iconPlugin, iconRefresh } from "@surrealdb/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Spacer } from "~/components/Spacer";
import {
	getSharedSurqlLspClient,
	onLiveMetadataCount,
	restartSharedSurqlLspClient,
	type SurqlLspError,
	type SurqlLspMetrics,
	type SurqlLspState,
	type SurqlLspTelemetry,
} from "~/editor/lsp";
import { useSetting } from "~/hooks/config";
import { showErrorNotification } from "~/util/helpers";
import classes from "./style.module.scss";

interface LogEntry {
	id: number;
	level: number;
	message: string;
	timestamp: number;
}

const MAX_LOG_ENTRIES = 50;
const METRICS_REFRESH_MS = 1500;

let nextLogId = 0;

/**
 * Status indicator for the SurrealQL language server.
 *
 * Renders an action-button pill in the top action bar showing whether
 * the server is initialising, ready, or has reported errors. Clicking
 * opens a popover with the most recent log messages, the live define
 * count, request latency, and a manual "Restart language server"
 * button when init has failed.
 */
export function LspStatus() {
	const [enabled] = useSetting("behavior", "useLanguageServer");
	const [opened, setOpened] = useState(false);
	const [state, setState] = useState<SurqlLspState>("loading");
	const [defineCount, setDefineCount] = useState(0);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [lastError, setLastError] = useState<SurqlLspError | null>(null);
	const [telemetry, setTelemetry] = useState<SurqlLspTelemetry | null>(null);
	const [metrics, setMetrics] = useState<SurqlLspMetrics | null>(null);
	const [restarting, setRestarting] = useState(false);

	const client = useMemo(() => (enabled ? getSharedSurqlLspClient() : null), [enabled]);
	const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!client) {
			setState("loading");
			setLastError(null);
			setLogs([]);
			setTelemetry(null);
			setMetrics(null);
			return;
		}

		let alive = true;

		const offState = client.onStateChange((next) => {
			if (alive) setState(next);
		});

		const offError = client.onError((error) => {
			if (alive) setLastError(error);
		});

		const offLog = client.onLog((level, message) => {
			if (!alive) return;
			setLogs((prev) => {
				const next = [...prev, { id: nextLogId++, level, message, timestamp: Date.now() }];
				return next.length > MAX_LOG_ENTRIES
					? next.slice(next.length - MAX_LOG_ENTRIES)
					: next;
			});
		});

		const offMetadata = onLiveMetadataCount((count) => {
			if (alive) setDefineCount(count);
		});

		setTelemetry(client.getTelemetry());
		setMetrics(client.getMetrics());

		return () => {
			alive = false;
			offState();
			offError();
			offLog();
			offMetadata();
		};
	}, [client]);

	useEffect(() => {
		if (!client || !opened) {
			if (refreshTimerRef.current !== null) {
				clearInterval(refreshTimerRef.current);
				refreshTimerRef.current = null;
			}
			return;
		}
		setTelemetry(client.getTelemetry());
		setMetrics(client.getMetrics());
		refreshTimerRef.current = setInterval(() => {
			setTelemetry(client.getTelemetry());
			setMetrics(client.getMetrics());
		}, METRICS_REFRESH_MS);
		return () => {
			if (refreshTimerRef.current !== null) {
				clearInterval(refreshTimerRef.current);
				refreshTimerRef.current = null;
			}
		};
	}, [client, opened]);

	if (!enabled) {
		return null;
	}

	const handleRestart = async () => {
		setRestarting(true);
		try {
			setLastError(null);
			await restartSharedSurqlLspClient();
		} catch (error) {
			showErrorNotification({
				title: "Failed to restart language server",
				content: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setRestarting(false);
		}
	};

	const tone: MantineColor = state === "failed" ? "red" : state === "ready" ? "green" : "yellow";

	const statusLabel =
		state === "failed"
			? "Language server failed"
			: state === "ready"
				? "Language server ready"
				: "Language server initialising";

	const description =
		state === "failed"
			? (lastError?.message ?? "The language server worker crashed unexpectedly.")
			: state === "ready"
				? "The language server is running and powering completions, hover, and diagnostics in the query editor."
				: "Initialising the language server worker…";

	return (
		<Popover
			position="bottom-end"
			width={440}
			shadow="md"
			withArrow
			opened={opened}
			onChange={setOpened}
		>
			<Popover.Target>
				<ActionButton
					label={statusLabel}
					color={tone}
					variant={state === "failed" ? "light" : "subtle"}
					onClick={() => setOpened((value) => !value)}
				>
					{state === "loading" ? (
						<Loader
							size="xs"
							color={tone}
						/>
					) : (
						<Icon path={state === "failed" ? iconErrorCircle : iconPlugin} />
					)}
				</ActionButton>
			</Popover.Target>
			<Popover.Dropdown p="md">
				<Stack gap="xs">
					<Group gap="xs">
						<Text fw={600}>SurrealQL language server</Text>
						<Spacer />
						<Badge
							color={tone}
							variant="light"
							size="sm"
						>
							{state}
						</Badge>
					</Group>
					<Text
						size="sm"
						className="selectable"
					>
						{description}
					</Text>
					{state === "failed" && (
						<Button
							leftSection={<Icon path={iconRefresh} />}
							variant="gradient"
							size="xs"
							onClick={handleRestart}
							loading={restarting}
						>
							Restart language server
						</Button>
					)}

					<Divider my={4} />

					<Group
						gap="xs"
						wrap="nowrap"
					>
						<Stat
							label="Schema defines"
							value={String(defineCount)}
						/>
						<Stat
							label="Time to ready"
							value={formatDuration(telemetry?.startedAt, telemetry?.readyAt)}
						/>
						<Stat
							label="Time to init"
							value={formatDuration(telemetry?.startedAt, telemetry?.initializedAt)}
						/>
						<Stat
							label="Restarts"
							value={String(telemetry?.restartCount ?? 0)}
						/>
					</Group>

					{metrics && Object.keys(metrics.perMethod).length > 0 && (
						<>
							<Text
								fw={600}
								size="sm"
								mt="xs"
							>
								Request latency
							</Text>
							<MetricsTable metrics={metrics} />
						</>
					)}

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
							h={140}
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

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<Box flex={1}>
			<Text
				size="xs"
				opacity={0.7}
			>
				{label}
			</Text>
			<Text
				size="sm"
				fw={600}
				className="selectable"
			>
				{value}
			</Text>
		</Box>
	);
}

function MetricsTable({ metrics }: { metrics: SurqlLspMetrics }) {
	const rows = Object.entries(metrics.perMethod)
		.sort(([, a], [, b]) => b.count - a.count)
		.slice(0, 6);

	return (
		<Table
			withRowBorders={false}
			verticalSpacing={2}
			horizontalSpacing="xs"
			fz="xs"
			className="selectable"
		>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Method</Table.Th>
					<Table.Th ta="right">N</Table.Th>
					<Table.Th ta="right">P50</Table.Th>
					<Table.Th ta="right">P95</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{rows.map(([method, sample]) => (
					<Table.Tr key={method}>
						<Table.Td>
							<Text
								size="xs"
								ff="monospace"
								truncate
							>
								{method}
							</Text>
						</Table.Td>
						<Table.Td ta="right">{sample.count}</Table.Td>
						<Table.Td ta="right">{formatMs(sample.p50)}</Table.Td>
						<Table.Td ta="right">{formatMs(sample.p95)}</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}

function formatDuration(startedAt?: number, completedAt?: number | null): string {
	if (!startedAt || !completedAt) return "—";
	const ms = completedAt - startedAt;
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatMs(ms: number): string {
	if (ms < 1) return `<1ms`;
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}
