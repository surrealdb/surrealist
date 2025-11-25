import { Box, Button, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { memo, useEffect, useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { useConnection } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/screens/surrealist/connection/connection";
import { MigrationDiagnosticResult } from "~/types";
import { iconRefresh, iconTransfer } from "~/util/icons";
import { DiagnosticDetailsPanel } from "../DiagnosticDetailsPanel";
import { DiagnosticsListPanel } from "../DiagnosticsListPanel";

const DiagnosticsListPanelLazy = memo(DiagnosticsListPanel);
const _DiagnosticDetailsPanelLazy = memo(DiagnosticDetailsPanel);

export function MigrationView() {
	const id = useConnection((c) => c?.id);

	const [runVersion, setRunVersion] = useState(0);
	const [completedOrigins, setCompletedOrigins] = useState<Record<string, number>>({});
	const [selectedDiagnosticKey, setSelectedDiagnosticKey] = useState<string | null>(null);

	const { data, isPending, isFetching, refetch } = useQuery<MigrationDiagnosticResult[]>({
		queryKey: ["migration", "diagnostics", id],
		enabled: false,
		refetchOnWindowFocus: false,
		queryFn: async () => {
			const [diagnostics] = await getSurreal().query("migration::diagnose()").collect();
			console.log("Diagnostics", diagnostics);
			return (diagnostics ?? []) as MigrationDiagnosticResult[];
		},
	});

	const diagnostics = data ?? [];

	const visibleDiagnostics = useMemo(() => {
		if (!diagnostics.length) {
			return diagnostics;
		}

		return diagnostics.filter((diagnostic) => {
			const completedAt = completedOrigins[diagnostic.origin];
			return !completedAt || completedAt === runVersion;
		});
	}, [diagnostics, completedOrigins, runVersion]);

	const completedOriginsThisRun = useMemo(() => {
		return new Set(
			Object.entries(completedOrigins)
				.filter(([, version]) => version === runVersion)
				.map(([origin]) => origin),
		);
	}, [completedOrigins, runVersion]);

	useEffect(() => {
		if (visibleDiagnostics.length === 0) {
			setSelectedDiagnosticKey(null);
			return;
		}

		setSelectedDiagnosticKey((current) => {
			if (current) {
				const stillExists = visibleDiagnostics.some(
					(diagnostic) => getDiagnosticKey(diagnostic) === current,
				);

				if (stillExists) {
					return current;
				}
			}

			return getDiagnosticKey(visibleDiagnostics[0]);
		});
	}, [visibleDiagnostics]);

	const selectedDiagnostic = useMemo(() => {
		if (!visibleDiagnostics.length) {
			return null;
		}

		if (!selectedDiagnosticKey) {
			return visibleDiagnostics[0];
		}

		return (
			visibleDiagnostics.find(
				(diagnostic) => getDiagnosticKey(diagnostic) === selectedDiagnosticKey,
			) ?? visibleDiagnostics[0]
		);
	}, [selectedDiagnosticKey, visibleDiagnostics]);

	const handleRunDiagnostics = useStable(async () => {
		const result = await refetch();

		if (!result.error) {
			setRunVersion((version) => version + 1);
		}
	});

	const handleRefreshDiagnostics = useStable(async () => {
		setRunVersion(0);
		setCompletedOrigins({});
		handleRunDiagnostics();
	});

	const handleSelectDiagnostic = useStable((diagnostic: MigrationDiagnosticResult) => {
		setSelectedDiagnosticKey(getDiagnosticKey(diagnostic));
	});

	const handleToggleOrigin = useStable((origin: string) => {
		setCompletedOrigins((current) => {
			const existing = current[origin];

			if (existing === runVersion) {
				const { [origin]: _, ...rest } = current;
				return rest;
			}

			return {
				...current,
				[origin]: runVersion,
			};
		});
	});

	const hasVisibleDiagnostics = visibleDiagnostics.length > 0;
	const hasHiddenDiagnostics = !hasVisibleDiagnostics && diagnostics.length > 0;

	return (
		<>
			{isPending && (
				<Center flex={1}>
					<Paper
						p="xl"
						maw={500}
						shadow="md"
					>
						<Stack>
							<Group>
								<Icon
									path={iconTransfer}
									size={1.35}
								/>
								<Title c="bright">Migration Diagnostics</Title>
							</Group>
							<Text>
								This tool will help you check if your database is compatible with
								SurrealDB 3.0, and helps you prepare for the migration.
							</Text>
							<Group mt="md">
								<Button
									variant="gradient"
									onClick={handleRunDiagnostics}
									loading={isFetching}
								>
									Start check
								</Button>
								<Button
									variant="light"
									color="slate"
								>
									Learn more
								</Button>
							</Group>
						</Stack>
					</Paper>
				</Center>
			)}
			{!isPending && !hasVisibleDiagnostics && (
				<Center flex={1}>
					<Paper
						p="xl"
						maw={500}
						shadow="md"
					>
						<Stack>
							<Title c="bright">
								{hasHiddenDiagnostics
									? "No pending migration issues"
									: "No migration issues found!"}
							</Title>
							<Text>
								{hasHiddenDiagnostics
									? "Everything you've marked as completed has been hidden from this rerun. Re-run diagnostics whenever you're ready to check again."
									: "You're all set! No migration issues were found for this database."}
							</Text>

							<Button
								mt="md"
								size="xs"
								variant="gradient"
								onClick={handleRefreshDiagnostics}
								loading={isFetching}
								rightSection={<Icon path={iconRefresh} />}
							>
								Check again
							</Button>
						</Stack>
					</Paper>
				</Center>
			)}
			{!isPending && hasVisibleDiagnostics && (
				<Content
					diagnostics={visibleDiagnostics}
					selectedDiagnostic={selectedDiagnostic}
					completedOrigins={completedOriginsThisRun}
					onSelectDiagnostic={handleSelectDiagnostic}
					onToggleOrigin={handleToggleOrigin}
					onRerun={handleRunDiagnostics}
					isFetching={isFetching}
				/>
			)}
		</>
	);
}

interface ContentProps {
	diagnostics: MigrationDiagnosticResult[];
	selectedDiagnostic: MigrationDiagnosticResult | null;
	completedOrigins: Set<string>;
	onSelectDiagnostic: (diagnostic: MigrationDiagnosticResult) => void;
	onToggleOrigin: (origin: string) => void;
	onRerun: () => void;
	isFetching: boolean;
}

function Content({
	diagnostics,
	selectedDiagnostic,
	completedOrigins,
	onSelectDiagnostic,
	onToggleOrigin,
	onRerun,
	isFetching,
}: ContentProps) {
	const [_minSize, ref] = usePanelMinSize(450);

	return (
		<Box
			h="100%"
			pr="lg"
			pb="lg"
			pl={{ base: "lg", md: 0 }}
			ref={ref}
		>
			{/* <PanelGroup direction="horizontal"> */}
			{/* <Panel minSize={minSize}> */}
			<DiagnosticsListPanelLazy
				diagnostics={diagnostics}
				selectedDiagnostic={selectedDiagnostic}
				completedOrigins={completedOrigins}
				onSelectDiagnostic={onSelectDiagnostic}
				onToggleOrigin={onToggleOrigin}
				onRerun={onRerun}
				isFetching={isFetching}
			/>
			{/* </Panel>
				<PanelDragger />
				<Panel
					defaultSize={minSize}
					minSize={minSize}
					maxSize={35}
				>
					<DiagnosticDetailsPanelLazy diagnostic={selectedDiagnostic} />
				</Panel>
			</PanelGroup> */}
		</Box>
	);
}

export default MigrationView;

function getDiagnosticKey(diagnostic: MigrationDiagnosticResult) {
	const location = diagnostic.location
		? `${diagnostic.location.label}-${diagnostic.location.line}-${diagnostic.location.column}`
		: "no-location";

	return `${diagnostic.origin}|${diagnostic.error}|${diagnostic.details}|${location}`;
}
