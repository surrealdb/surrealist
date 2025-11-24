import { Button, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "~/components/Icon";
import { useConnection } from "~/hooks/connection";
import { getSurreal } from "~/screens/surrealist/connection/connection";
import { MigrationDiagnosticResult } from "~/types";
import { iconRefresh, iconTransfer, iconWarning } from "~/util/icons";

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

	return (
		<Center flex={1}>
			{isPending && (
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
			)}
			{!isPending && (!data || data.length === 0) && (
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
			)}
			{!isPending && data && data.length > 0 && (
				<Paper
					p="xl"
					maw={500}
					shadow="md"
				>
					{data.map((issue) => (
						<Group
							key={issue.error}
							gap="xs"
						>
							<Icon path={iconWarning} />
							<Text>{issue.error}</Text>
						</Group>
					))}
				</Paper>
			)}
		</Center>
	);
}

export default MigrationView;
