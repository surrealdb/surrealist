import {
	Badge,
	Box,
	Button,
	Center,
	Group,
	Loader,
	type MantineColor,
	Paper,
	Popover,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import {
	Icon,
	iconDownload,
	iconErrorCircle,
	iconHelp,
	iconPlugin,
	iconRefresh,
	iconWarning,
} from "@surrealdb/ui";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
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
import { useIsLight } from "~/hooks/theme";
import { showErrorNotification, showInfo } from "~/util/helpers";
import classes from "./style.module.scss";

interface LogEntry {
	id: number;
	level: number;
	message: string;
	timestamp: number;
}

const MAX_LOG_ENTRIES = 50;
const METRICS_REFRESH_MS = 1500;

const LOG_FILE_FILTER = {
	name: "Log file",
	extensions: ["log", "txt"],
};

const LOG_LEVEL_INFO: Record<number, { label: string; color: MantineColor; icon: string }> = {
	1: { label: "Error", color: "red", icon: iconErrorCircle },
	2: { label: "Warn", color: "orange", icon: iconWarning },
};

const DEFAULT_LOG_LEVEL = { label: "Info", color: "obsidian" as MantineColor, icon: iconHelp };

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
	const isLight = useIsLight();
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
	const logViewportRef = useRef<HTMLDivElement>(null);
	const openedRef = useRef(opened);
	openedRef.current = opened;

	const scrollLogsToEnd = useCallback(() => {
		requestAnimationFrame(() => {
			if (openedRef.current && logViewportRef.current) {
				logViewportRef.current.scrollTop = logViewportRef.current.scrollHeight;
			}
		});
	}, []);

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
			scrollLogsToEnd();
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
	}, [client, scrollLogsToEnd]);

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

	// Pin the log panel to the newest entries when the popover opens.
	useEffect(() => {
		if (!opened) return;
		scrollLogsToEnd();
	}, [opened, scrollLogsToEnd]);

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

	const handleExportLogs = async () => {
		if (logs.length === 0) return;

		try {
			const exportedAt = new Date();
			const exportContent = formatLogExport(logs, state, telemetry, exportedAt);
			const exportBlob = new Blob([exportContent], {
				type: "text/plain;charset=utf-8",
			});

			const success = await adapter.saveFile(
				"Export language server log",
				`surrealql-lsp-${format(exportedAt, "yyyy-MM-dd-HHmmss")}.log`,
				[LOG_FILE_FILTER],
				() => exportBlob,
			);

			if (success) {
				showInfo({
					title: "Log exported",
					subtitle: "The language server log has been saved to disk",
				});
			}
		} catch (error) {
			showErrorNotification({
				title: "Failed to export log",
				content: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const tone: MantineColor = state === "failed" ? "red" : state === "ready" ? "green" : "yellow";

	const statusLabel =
		state === "failed"
			? "Language server failed"
			: state === "ready"
				? "Language server ready"
				: "Language server initialising";

	const statusBadge =
		state === "failed" ? "Failed" : state === "ready" ? "Ready" : "Initialising";

	const description =
		state === "failed"
			? (lastError?.message ?? "The language server worker crashed unexpectedly.")
			: state === "ready"
				? "Powering completions, hover, and diagnostics in the query editor."
				: "Initialising the language server worker…";

	const metricRows =
		metrics && Object.keys(metrics.perMethod).length > 0
			? Object.entries(metrics.perMethod)
					.sort(([, a], [, b]) => b.count - a.count)
					.slice(0, 6)
			: [];

	return (
		<Popover
			position="bottom-end"
			width={460}
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
				<Stack gap="md">
					<Group
						gap="sm"
						wrap="nowrap"
					>
						<Box flex={1}>
							<PrimaryTitle fz={18}>SurrealQL language server</PrimaryTitle>
							<Text
								size="sm"
								mt={4}
							>
								{description}
							</Text>
						</Box>
						<Badge
							variant="dot"
							color={tone}
						>
							{statusBadge}
						</Badge>
					</Group>

					{state === "failed" && (
						<Button
							leftSection={<Icon path={iconRefresh} />}
							variant="gradient"
							size="compact-sm"
							onClick={handleRestart}
							loading={restarting}
						>
							Restart language server
						</Button>
					)}

					<SimpleGrid
						cols={2}
						spacing="xs"
					>
						<StatTile
							label="Schema defines"
							value={String(defineCount)}
						/>
						<StatTile
							label="Restarts"
							value={String(telemetry?.restartCount ?? 0)}
						/>
						<StatTile
							label="Time to ready"
							value={formatDuration(telemetry?.startedAt, telemetry?.readyAt)}
						/>
						<StatTile
							label="Time to init"
							value={formatDuration(telemetry?.startedAt, telemetry?.initializedAt)}
						/>
					</SimpleGrid>

					{metricRows.length > 0 && (
						<Box>
							<Label mb="xs">Request latency</Label>
							<Paper
								withBorder
								radius="sm"
								p={0}
								style={{ overflow: "hidden" }}
							>
								<ScrollArea.Autosize
									mah={180}
									type="auto"
								>
									<Box
										component="table"
										className={classes.metricsTable}
									>
										<Box component="thead">
											<Box component="tr">
												<Box component="th">Method</Box>
												<Box component="th">N</Box>
												<Box component="th">P50</Box>
												<Box component="th">P95</Box>
											</Box>
										</Box>
										<Box
											component="tbody"
											className="selectable"
										>
											{metricRows.map(([method, sample]) => (
												<Box
													component="tr"
													key={method}
												>
													<Box
														component="td"
														className={classes.methodCell}
														title={method}
													>
														{formatMethodName(method)}
													</Box>
													<Box component="td">{sample.count}</Box>
													<Box component="td">{formatMs(sample.p50)}</Box>
													<Box component="td">{formatMs(sample.p95)}</Box>
												</Box>
											))}
										</Box>
									</Box>
								</ScrollArea.Autosize>
							</Paper>
						</Box>
					)}

					<Box>
						<Group
							gap="xs"
							mb="xs"
						>
							<Label mb={0}>Recent log messages</Label>
							<Spacer />
							{logs.length > 0 && (
								<>
									<Text size="xs">{logs.length} entries</Text>
									<ActionButton
										label="Export log"
										size="sm"
										variant="subtle"
										onClick={handleExportLogs}
									>
										<Icon
											path={iconDownload}
											size="sm"
										/>
									</ActionButton>
								</>
							)}
						</Group>
						<Paper
							withBorder
							radius="sm"
							p={0}
							className={classes.logPanel}
						>
							{logs.length === 0 ? (
								<Center
									h={120}
									p="md"
								>
									<Text size="sm">No log messages yet.</Text>
								</Center>
							) : (
								<ScrollArea
									h={160}
									type="auto"
									viewportRef={logViewportRef}
								>
									<Stack
										gap={0}
										className="selectable"
									>
										{logs
											.slice()
											.reverse()
											.map((entry) => (
												<LogLine
													key={entry.id}
													entry={entry}
													isLight={isLight}
												/>
											))}
									</Stack>
								</ScrollArea>
							)}
						</Paper>
					</Box>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}

function StatTile({ label, value }: { label: string; value: string }) {
	return (
		<Paper
			p="sm"
			radius="sm"
			className={classes.statTile}
		>
			<Label
				opacity={0.75}
				mb={2}
			>
				{label}
			</Label>
			<Text
				c="bright"
				fw={600}
				size="sm"
				className="selectable"
			>
				{value}
			</Text>
		</Paper>
	);
}

function LogLine({ entry, isLight }: { entry: LogEntry; isLight: boolean }) {
	const level = LOG_LEVEL_INFO[entry.level] ?? DEFAULT_LOG_LEVEL;

	return (
		<Group
			gap="sm"
			px="sm"
			py={6}
			wrap="nowrap"
			align="flex-start"
			className={classes.logLine}
			data-level={entry.level}
			bg={isLight ? undefined : "obsidian.8"}
		>
			<Badge
				variant="light"
				color={level.color}
				size="xs"
				w={52}
				styles={{ label: { overflow: "hidden", textOverflow: "ellipsis" } }}
				leftSection={
					<Icon
						path={level.icon}
						size="sm"
					/>
				}
			>
				{level.label}
			</Badge>
			<Text
				className={classes.logTime}
				w={72}
			>
				{format(entry.timestamp, "HH:mm:ss")}
			</Text>
			<Text
				flex={1}
				className={classes.logMessage}
			>
				{entry.message}
			</Text>
		</Group>
	);
}

function formatLogLevel(level: number): string {
	return LOG_LEVEL_INFO[level]?.label.toUpperCase() ?? "INFO";
}

function formatLogExport(
	logs: LogEntry[],
	state: SurqlLspState,
	telemetry: SurqlLspTelemetry | null,
	exportedAt: Date,
): string {
	const header = [
		"SurrealQL Language Server Log",
		`Exported: ${format(exportedAt, "yyyy-MM-dd HH:mm:ss")}`,
		`State: ${state}`,
		`Restarts: ${telemetry?.restartCount ?? 0}`,
		`Entries: ${logs.length}`,
		"",
	];

	const body = logs.map((entry) => {
		const time = format(entry.timestamp, "yyyy-MM-dd HH:mm:ss");
		return `[${time}] ${formatLogLevel(entry.level).padEnd(5)} ${entry.message}`;
	});

	return [...header, ...body].join("\n");
}

function formatMethodName(method: string): string {
	return method.replace(/^textDocument\//, "");
}

function formatDuration(startedAt?: number, completedAt?: number | null): string {
	if (!startedAt || !completedAt) return "—";
	const ms = completedAt - startedAt;
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatMs(ms: number): string {
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

let nextLogId = 0;
