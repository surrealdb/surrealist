import { Box, Button, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Icon } from "~/components/Icon";
import { PanelDragger } from "~/components/Pane/dragger";
import { useConnection } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { getSurreal } from "~/screens/surrealist/connection/connection";
import { MigrationDiagnosticResult } from "~/types";
import { iconRefresh, iconTransfer } from "~/util/icons";
import { DiagnosticDetailsPanel } from "../DiagnosticDetailsPanel";
import { DiagnosticsListPanel } from "../DiagnosticsListPanel";

const DiagnosticsListPanelLazy = memo(DiagnosticsListPanel);
const DiagnosticDetailsPanelLazy = memo(DiagnosticDetailsPanel);

export function MigrationView() {
	const id = useConnection((c) => c?.id);

	const { data, isPending, isFetching, refetch } = useQuery({
		queryKey: ["migration", "diagnostics", id],
		enabled: false,
		queryFn: async () => {
			const [diagnostics] = await getSurreal().query("migration::diagnose()").collect();
			console.log("Diagnostics", diagnostics);
			return (diagnostics ?? []) as MigrationDiagnosticResult[];
		},
	});

	const diagnostics = data ?? [];

	const [details, setDetails] = useState(true);

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
									onClick={() => refetch()}
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
			{!isPending && diagnostics.length === 0 && (
				<Center flex={1}>
					<Paper
						p="xl"
						maw={500}
						shadow="md"
					>
						<Stack>
							<Title c="bright">No migration issues found!</Title>
							<Text>
								You're all set! No migration issues were found for this database
							</Text>

							<Button
								mt="md"
								size="xs"
								variant="gradient"
								onClick={() => refetch()}
								loading={isFetching}
								rightSection={<Icon path={iconRefresh} />}
							>
								Check again
							</Button>
						</Stack>
					</Paper>
				</Center>
			)}
			{!isPending && diagnostics.length > 0 && <Content />}
		</>
	);
}

function Content() {
	const [minSize, ref] = usePanelMinSize(450);

	return (
		<Box
			h="100%"
			pr="lg"
			pb="lg"
			pl={{ base: "lg", md: 0 }}
			ref={ref}
		>
			<PanelGroup direction="horizontal">
				<Panel minSize={minSize}>
					<DiagnosticsListPanelLazy />
				</Panel>
				<PanelDragger />
				<Panel
					defaultSize={minSize}
					minSize={minSize}
					maxSize={35}
				>
					<DiagnosticDetailsPanelLazy />
				</Panel>
			</PanelGroup>
		</Box>
	);
}

export default MigrationView;
