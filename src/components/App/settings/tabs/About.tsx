import { Stack, Text } from "@mantine/core";
import { LearnMore } from "~/components/LearnMore";

export function AboutTab() {
	return (
		<>
			<Text>Surrealist &copy; 2024 SurrealDB Ltd</Text>
			<Stack
				gap="xs"
				mt="sm"
			>
				<Text>Version: {import.meta.env.VERSION}</Text>
				<Text>Built on: {import.meta.env.DATE}</Text>
				<Text>Build mode: {import.meta.env.MODE}</Text>
				<Text>SDB Minimum: {import.meta.env.SDB_VERSION}</Text>
			</Stack>
			<Stack mt="xl">
				<LearnMore href="https://github.com/surrealdb/surrealist/">
					GitHub Repository
				</LearnMore>
				<LearnMore href="https://surrealdb.com/docs/surrealist">
					Surrealist Documentation
				</LearnMore>
			</Stack>
		</>
	);
}
