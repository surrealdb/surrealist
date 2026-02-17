import {
	Anchor,
	Box,
	Button,
	Center,
	Group,
	Image,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { Icon, iconDownload, iconReset, iconTransfer, pictoSurrealDB } from "@surrealdb/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { Spacer } from "~/components/Spacer";
import { StarSparkles } from "~/components/StarSparkles";
import { SURQL_FILTER } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/screens/surrealist/connection/connection";
import { MigrationDiagnosticResult, MigrationResourceType } from "~/types";
import { tagEvent } from "~/util/analytics";
import { showInfo } from "~/util/helpers";
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

			tagEvent("migration_export");
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
					w={500}
					shadow="md"
				>
					<Stack>
						<Group>
							<Icon path={iconTransfer} />
							<Title c="bright">Migrate to SurrealDB 3.0</Title>
						</Group>
						<Text mt="sm">
							To ensure a smooth migration to SurrealDB 3.0, this tool will help you
							diagnose any issues with your database and ensure a smooth upgrade.
						</Text>
						<Group mt="md">
							<Button
								variant="gradient"
								onClick={handleRunDiagnostics}
								loading={isFetching}
							>
								Check compatibility
							</Button>
							<Anchor href="https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x">
								<Button
									variant="light"
									color="slate"
								>
									Learn more
								</Button>
							</Anchor>
						</Group>
					</Stack>
				</Paper>
			</Center>
		);
	}

	// All issues resolved - show success screen
	if (data && unresolvedIssues === 0 && !selectedResource) {
		const hasResolvedIssues = totalIssues > 0;

		return (
			<Center flex={1}>
				<Paper
					p="xl"
					w={500}
					shadow="md"
				>
					<Stack>
						<Stack
							justify="center"
							gap={0}
							mb="md"
						>
							<Box mx="auto">
								<StarSparkles
									offsetBase={0}
									offsetModifier={0}
								>
									<Image
										src={pictoSurrealDB}
										alt="SurrealDB"
										w={74}
									/>
								</StarSparkles>
							</Box>
							<Title
								ta="center"
								c="bright"
								order={1}
								fz={26}
							>
								You're all set!
							</Title>
						</Stack>
						{hasResolvedIssues ? (
							<Text fz="lg">
								You have addressed all migration issues. Your database is ready to
								be upgraded to SurrealDB 3.0.
							</Text>
						) : (
							<Text fz="lg">
								Your database is already compatible with SurrealDB 3.0, no changes
								are required to upgrade.
							</Text>
						)}
						<Text fz="lg">
							Press the button below to create an export of your database which can be
							restored in a SurrealDB 3.0 instance.
						</Text>
						<Group mt="md">
							<Button
								variant="gradient"
								onClick={() => exportMutation.mutate()}
								loading={exportMutation.isPending}
								rightSection={<Icon path={iconDownload} />}
							>
								Export database
							</Button>
							<Spacer />
							<Button
								variant="light"
								color="slate"
								onClick={handleRestartDiagnostics}
								rightSection={<Icon path={iconReset} />}
							>
								Restart check
							</Button>
						</Group>
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
					unresolvedIssues={unresolvedIssues}
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
