import { Box, Button, Center, Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { SURQL_FILTER } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/screens/surrealist/connection/connection";
import { MigrationDiagnosticResult, MigrationResourceType } from "~/types";
import { showInfo } from "~/util/helpers";
import { iconCheck, iconDownload, iconTransfer } from "~/util/icons";
import { ResourceDetailPanel } from "../ResourceDetailPanel";
import { ResourceOverviewPanel } from "../ResourceOverviewPanel";
import { DiagnosticResource, organizeDiagnostics, ResourceMap } from "./organizer";

export function MigrationView() {
	const connectionId = useConnection((c) => c?.id);

	// State for opened resource types
	const [openedTypes, setOpenedTypes] = useState<string[]>([]);

	// State for resolved diagnostic entry IDs
	const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

	// State for selected resource (detail view)
	const [selectedResource, setSelectedResource] = useState<{
		type: MigrationResourceType;
		resource: DiagnosticResource;
	} | null>(null);

	const { data, isPending, isFetching, refetch } = useQuery<ResourceMap>({
		queryKey: ["migration", "diagnostics", connectionId],
		enabled: false,
		refetchOnWindowFocus: false,
		queryFn: async () => {
			const [diagnostics] = await getSurreal()
				.query("migration::diagnose()")
				.collect<[MigrationDiagnosticResult[]]>();

			return organizeDiagnostics(diagnostics ?? []);
		},
	});

	const exportMutation = useMutation({
		mutationFn: async () => {
			const backup = new Blob([
				await getSurreal().export({
					versions: true,
					v3: true,
				}),
			]);

			await adapter.saveFile(
				"Save database export",
				"v3-export.surql",
				[SURQL_FILTER],
				() => backup,
			);

			showInfo({
				title: "Database export",
				subtitle: "The database has been exported successfully",
			});
		},
	});

	// Count total and unresolved issues
	const { totalIssues, unresolvedIssues } = useMemo(() => {
		if (!data) return { totalIssues: 0, unresolvedIssues: 0 };

		let total = 0;
		let unresolved = 0;

		for (const type of Object.keys(data) as MigrationResourceType[]) {
			for (const resource of data[type]) {
				for (const entry of resource.entries) {
					total++;
					if (!resolvedIds.has(entry.id)) {
						unresolved++;
					}
				}
			}
		}

		return { totalIssues: total, unresolvedIssues: unresolved };
	}, [data, resolvedIds]);

	const handleRunDiagnostics = useStable(async () => {
		await refetch();
	});

	const handleRefreshDiagnostics = useStable(async () => {
		setSelectedResource(null);
		await refetch();
	});

	const handleRestartDiagnostics = useStable(async () => {
		setResolvedIds(new Set());
		await handleRefreshDiagnostics();
	});

	const handleSelectResource = useStable(
		(type: MigrationResourceType, resource: DiagnosticResource) => {
			setSelectedResource({ type, resource });
		},
	);

	const handleBack = useStable(() => {
		setSelectedResource(null);
	});

	const handleToggleResolved = useStable((entryId: string) => {
		setResolvedIds((current) => {
			const next = new Set(current);
			if (next.has(entryId)) {
				next.delete(entryId);
			} else {
				next.add(entryId);
			}
			return next;
		});
	});

	// Initial state - show start screen
	if (isPending) {
		return (
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
		);
	}

	// All issues resolved - show success screen
	if (data && unresolvedIssues === 0) {
		const hasResolvedIssues = totalIssues > 0;

		return (
			<Center flex={1}>
				<Paper
					p="xl"
					maw={500}
					shadow="md"
				>
					<Stack
						align="center"
						ta="center"
					>
						<ThemeIcon
							size={64}
							radius="xl"
							color="slate"
							variant="light"
						>
							<Icon
								path={iconCheck}
								size={1.5}
							/>
						</ThemeIcon>
						<Title
							c="bright"
							order={2}
						>
							{hasResolvedIssues
								? "All issues resolved!"
								: "No migration issues found!"}
						</Title>
						<Text>
							{hasResolvedIssues
								? "You have addressed all migration issues. Your database is ready to be upgraded to SurrealDB 3.0."
								: "Your database is already compatible with SurrealDB 3.0. No changes are required."}
						</Text>
						<Button
							mt="md"
							variant="gradient"
							onClick={() => exportMutation.mutate()}
							loading={exportMutation.isPending}
							rightSection={<Icon path={iconDownload} />}
						>
							Export database
						</Button>
					</Stack>
				</Paper>
			</Center>
		);
	}

	// Show content - either overview or detail
	return (
		<Box
			h="100%"
			pr="lg"
			pb="lg"
			pl={{ base: "lg", md: 0 }}
		>
			{selectedResource ? (
				<ResourceDetailPanel
					type={selectedResource.type}
					resource={selectedResource.resource}
					resolvedIds={resolvedIds}
					onBack={handleBack}
					onToggleResolved={handleToggleResolved}
				/>
			) : (
				data && (
					<ResourceOverviewPanel
						resources={data}
						resolvedIds={resolvedIds}
						openedTypes={openedTypes}
						onChangeOpenedTypes={setOpenedTypes}
						onSelectResource={handleSelectResource}
						onRestart={handleRestartDiagnostics}
						onRerun={handleRefreshDiagnostics}
						isFetching={isFetching}
					/>
				)
			)}
		</Box>
	);
}

export default MigrationView;
