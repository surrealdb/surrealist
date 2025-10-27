import {
	Badge,
	Box,
	BoxProps,
	Button,
	Group,
	MantineColor,
	MultiSelect,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Timeline,
	UnstyledButton,
} from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { formatDistanceToNow } from "date-fns";
import { FC, memo, useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { CodePreview } from "~/components/CodePreview";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { JSON_FILTER } from "~/constants";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { DiagnosticWithTime, useDatabaseStore } from "~/stores/database";
import { showInfo } from "~/util/helpers";
import {
	iconArrowLeft,
	iconAuth,
	iconDownload,
	iconFilter,
	iconQuery,
	iconServer,
	iconTransfer,
	iconWrench,
} from "~/util/icons";

interface DiagnosticEntry {
	id: string;
	before: DiagnosticWithTime;
	progress: DiagnosticWithTime[];
	after?: DiagnosticWithTime;
}

type Decoration = [string, MantineColor];

const QUERY_DECORATION: Decoration = [iconQuery, "orange"];
const AUTH_DECORATION: Decoration = [iconAuth, "red"];
const SERVER_DECORATION: Decoration = [iconServer, "blue"];
const DATA_DECORATION: Decoration = [iconTransfer, "green"];
const OTHER_DECORATION: Decoration = [iconWrench, "slate"];

const DIAGNOSTIC_TYPES: Record<string, string> = {
	query: "Query",
	liveQuery: "Live query",
	version: "Version",
	signup: "Sign up",
	signin: "Sign in",
	authenticate: "Authenticate",
	open: "Open",
	close: "Close",
	health: "Health",
	use: "Use",
	importSql: "Import SQL",
	exportSql: "Export SQL",
	exportMlModel: "Export ML model",
};

function getTypeDecoration(type: string): Decoration {
	switch (type) {
		case "query":
		case "liveQuery":
			return QUERY_DECORATION;
		case "signin":
		case "signup":
		case "authenticate":
		case "invalidate":
		case "reset":
			return AUTH_DECORATION;
		case "open":
		case "close":
		case "health":
		case "version":
		case "use":
			return SERVER_DECORATION;
		case "exportSql":
		case "importSql":
		case "exportMlModel":
			return DATA_DECORATION;
		default:
			return OTHER_DECORATION;
	}
}

export function openConnectionDiagnosticsModal() {
	openModal({
		modalId: "connection-diagnostics",
		title: <PrimaryTitle>Connection diagnostics</PrimaryTitle>,
		withCloseButton: true,
		size: "xl",
		children: <ConnectionDiagnosticsSelector />,
	});
}

function ConnectionDiagnosticsSelector() {
	const closeSelector = useStable(() => closeModal("connection-diagnostics"));
	const [recordDiagnostics, setRecordDiagnostics] = useSetting("behavior", "recordDiagnostics");
	const isLight = useIsLight();

	const [focusedDiagnostic, setFocusedDiagnostic] = useState<DiagnosticEntry | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<string[]>([]);

	const diagnostics = useDatabaseStore((s) => s.diagnostics);

	const handleFilterChange = useStable((value: string[]) => {
		setSelectedFilter(value);
		setFocusedDiagnostic(null);
	});

	const diagnosticEvents = useMemo(() => {
		const eventMap = new Map<string, DiagnosticEntry>();

		for (const diagnostic of diagnostics) {
			const key = diagnostic.key.toString();
			let event = eventMap.get(key);

			if (!event) {
				if (diagnostic.phase !== "before") {
					continue;
				}

				event = { id: key, before: diagnostic, progress: [] };
				eventMap.set(key, event);
			}

			if (diagnostic.phase === "progress") {
				event.progress.push(diagnostic);
			} else if (diagnostic.phase === "after") {
				event.after = diagnostic;
			}
		}

		return Array.from(eventMap.values()).reverse();
	}, [diagnostics]);

	const filteredEvents = useMemo(() => {
		if (!selectedFilter.length) {
			return diagnosticEvents;
		}

		return diagnosticEvents.filter((event) => selectedFilter.includes(event.before.type));
	}, [diagnosticEvents, selectedFilter]);

	const diagnosticTypes = useMemo(() => {
		return Object.entries(DIAGNOSTIC_TYPES).map(([value, label]) => ({
			value,
			label,
		}));
	}, []);

	const exportDiagnostics = useStable(async () => {
		await adapter.saveFile(
			"Connection diagnostics",
			"connection-diagnostics.json",
			[JSON_FILTER],
			async () => {
				return JSON.stringify(diagnostics, null, 4);
			},
		);

		showInfo({
			title: "Diagnostics exported",
			subtitle: "The diagnostics have been exported to disk",
		});

		closeSelector();
	});

	return recordDiagnostics ? (
		<Stack>
			{focusedDiagnostic ? (
				<Group>
					<Button
						leftSection={<Icon path={iconArrowLeft} />}
						onClick={() => setFocusedDiagnostic(null)}
						color="slate"
						variant="light"
					>
						Back to diagnostics
					</Button>
					<Paper
						bd="none"
						bg={isLight ? "slate.4" : "slate.7"}
						flex={1}
					>
						<DiagnosticDetails entry={focusedDiagnostic} />
					</Paper>
				</Group>
			) : (
				<Group>
					<MultiSelect
						leftSection={<Icon path={iconFilter} />}
						placeholder="Select filters"
						data={diagnosticTypes}
						value={selectedFilter}
						onChange={handleFilterChange}
						clearable
						flex={1}
						styles={{
							input: {
								display: "flex",
								alignItems: "center",
							},
						}}
					/>
					<Text>
						{filteredEvents.length} diagnostics{" "}
						{selectedFilter.length > 0 ? "filtered" : "recorded"}
					</Text>
				</Group>
			)}
			<Box
				pos="relative"
				h="calc(100vh - 500px)"
				mt="md"
			>
				<ScrollArea
					pos="absolute"
					inset={0}
				>
					{focusedDiagnostic ? (
						<DiagnosticTimeline entry={focusedDiagnostic} />
					) : filteredEvents.length === 0 ? (
						<Paper
							p="lg"
							bd="none"
							bg={isLight ? "slate.2" : "slate.8"}
						>
							<Text
								c="dimmed"
								ta="center"
							>
								No diagnostics found with the selected filter.
							</Text>
						</Paper>
					) : (
						<Stack>
							{filteredEvents.map((diagnostic) => (
								<DiagnosticEntry
									key={diagnostic.id}
									entry={diagnostic}
									isLight={isLight}
									onSelect={setFocusedDiagnostic}
								/>
							))}
						</Stack>
					)}
				</ScrollArea>
			</Box>
			<Group mt="xl">
				<Button
					color="slate"
					variant="light"
					onClick={closeSelector}
				>
					Close
				</Button>
				<Spacer />
				<Button
					color="slate"
					variant="light"
					onClick={() => setRecordDiagnostics(false)}
				>
					Stop recording
				</Button>
				<Button
					color="slate"
					variant="light"
					onClick={exportDiagnostics}
					rightSection={<Icon path={iconDownload} />}
				>
					Export diagnostics
				</Button>
			</Group>
		</Stack>
	) : (
		<Paper>
			<Stack
				h={250}
				align="center"
				justify="center"
				gap={0}
			>
				<Text
					c="bright"
					fz="h2"
					fw={600}
				>
					Diagnostics are disabled
				</Text>
				<Text mt="xs">
					Enable diagnostics recording to view detailed information about the connection.
				</Text>
				<Text>This may impact performance slightly depending on workload.</Text>
				<Button
					mt="xl"
					variant="gradient"
					onClick={() => setRecordDiagnostics(true)}
				>
					Enable diagnostics
				</Button>
			</Stack>
		</Paper>
	);
}

const DiagnosticDetails: FC<{ entry: DiagnosticEntry } & BoxProps> = memo(({ entry, ...rest }) => {
	const [icon, color] = getTypeDecoration(entry.before.type);

	return (
		<Group
			h={36}
			px="md"
			{...rest}
		>
			<Badge
				color={color}
				variant="transparent"
				h="unset"
				radius="xs"
				py={2}
				px={0}
				tt="capitalize"
				leftSection={
					<Icon
						path={icon}
						size="md"
						mr={2}
					/>
				}
			>
				{DIAGNOSTIC_TYPES[entry.before.type] ?? entry.before.type}
			</Badge>
			{entry.after?.phase === "after" ? (
				<Text>
					Completed{" "}
					<Text
						span
						inherit
						c="bright"
					>
						{entry.after.success ? "successfully" : "with failure"}
					</Text>{" "}
					in{" "}
					<Text
						span
						inherit
						ff="monospace"
					>
						{entry.after.duration.toString()}
					</Text>
				</Text>
			) : entry.progress.length > 0 ? (
				<Text>In progress...</Text>
			) : (
				<Text>Not started yet</Text>
			)}
			<Spacer />
			<Text c="slate">
				{formatDistanceToNow(entry.before.timestamp, {
					addSuffix: true,
				})}
			</Text>
		</Group>
	);
});

const DiagnosticEntry: FC<
	{
		entry: DiagnosticEntry;
		isLight: boolean;
		onSelect: (entry: DiagnosticEntry) => void;
	} & BoxProps
> = memo(({ entry, isLight, onSelect, ...rest }) => {
	const handleSelect = useStable(() => onSelect(entry));

	return (
		<UnstyledButton onClick={handleSelect}>
			<Paper
				bd="none"
				bg={isLight ? "slate.4" : "slate.7"}
				{...rest}
			>
				<DiagnosticDetails entry={entry} />
			</Paper>
		</UnstyledButton>
	);
});

const DiagnosticTimeline: FC<{ entry: DiagnosticEntry }> = memo(({ entry }) => {
	return (
		<Timeline color="violet">
			{entry.progress.map((prog, index) => (
				<Timeline.Item
					key={index}
					title={<Label>Progress update #{index + 1}</Label>}
				>
					<CodePreview
						language="json"
						value={JSON.stringify(
							prog.phase === "progress" ? prog.result : {},
							null,
							2,
						)}
					/>
				</Timeline.Item>
			))}
			{entry.after?.phase === "after" && (
				<Timeline.Item title={<Label>Final update</Label>}>
					{entry.after.success ? (
						<CodePreview
							language="json"
							value={JSON.stringify(
								(entry.after?.phase === "after" && entry.after.result) || {},
								null,
								2,
							)}
						/>
					) : (
						<Paper p="md">
							<Text
								c="red"
								ff="monospace"
							>
								{String(entry.after.error)}
							</Text>
						</Paper>
					)}
				</Timeline.Item>
			)}
		</Timeline>
	);
});
