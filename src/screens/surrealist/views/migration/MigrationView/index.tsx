import { Button, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "~/components/Icon";
import { useConnection } from "~/hooks/connection";
import { getSurreal } from "~/screens/surrealist/connection/connection";
import { iconTransfer } from "~/util/icons";

export function MigrationView() {
	const id = useConnection((c) => c?.id);

	const { data, isPending, isFetching, refetch } = useQuery({
		queryKey: ["migration", "diagnostics", id],
		enabled: false,
		queryFn: async () => {
			const [diagnostics] = await getSurreal().query("migration::diagnose()").collect();
			console.log("Diagnostics", diagnostics);
			return diagnostics ?? [];
		},
	});

	return (
		<Center flex={1}>
			{isPending ? (
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
			) : (
				<div>Value = {JSON.stringify(data)}</div>
			)}
		</Center>
	);
}

export default MigrationView;
