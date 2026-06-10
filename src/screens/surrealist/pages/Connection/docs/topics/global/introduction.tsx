import { Box, Button, Paper, Text, Title } from "@mantine/core";
import { Icon, iconOpen } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { DriverSelector } from "~/components/DriverSelector";
import { DRIVERS } from "~/constants";
import { useSetting } from "~/hooks/config";
import { Article } from "~/screens/surrealist/pages/Connection/docs/components";

export function DocsGlobalIntroduction() {
	const [language, setLanguage] = useSetting("behavior", "docsLanguage");
	const active = DRIVERS.find((lib) => lib.id === language);

	return (
		<Article>
			<Box>
				<Box component="p">
					SurrealDB provides official SDKs for Rust, JavaScript, Python, Go, Java, .NET,
					PHP, and more. This documentation shows how to connect to your active database
					and interact with its schema using your preferred language. Code examples are
					personalised with your connection details and table names.
				</Box>

				<Title
					order={2}
					mt="xl"
				>
					Client libraries
				</Title>
				<Box component="p">
					Client libraries handle connection management and provide high-level methods for
					CRUD, authentication, live queries, and raw SurrealQL execution.
				</Box>
				<Title
					order={2}
					mt="xl"
				>
					CLI and SurrealQL
				</Title>
				<Box component="p">
					Select CLI from the language picker to see raw SurrealQL and command-line
					examples. This is useful for scripting, migrations, and quick experimentation.
				</Box>
				{active && (
					<>
						<Title
							order={2}
							mt="xl"
						>
							Learn more
						</Title>
						<Box component="p">
							Visit the official documentation for the selected SDK.
						</Box>
						<Button
							variant="gradient"
							rightSection={<Icon path={iconOpen} />}
							onClick={() => adapter.openUrl(active.link)}
							size="xs"
						>
							Visit {active.name} docs
						</Button>
					</>
				)}
			</Box>
			<Box>
				<Text
					fz="lg"
					ff="mono"
					tt="uppercase"
					fw={600}
					mb="sm"
					c="bright"
				>
					Select a preview language
				</Text>
				<Paper
					p="md"
					radius="lg"
				>
					<DriverSelector
						value={language}
						onChange={setLanguage}
						exclude={["c"]}
						cols={{
							xs: 1,
							sm: 2,
							md: 3,
							lg: 4,
							xl: 6,
						}}
					/>
				</Paper>
			</Box>
		</Article>
	);
}
