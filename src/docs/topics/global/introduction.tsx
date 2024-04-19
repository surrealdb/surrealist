import classes from "../../style.module.scss";
import { Article } from "~/docs/components";
import { Anchor, Box, Paper, SimpleGrid, Text, Title } from "@mantine/core";
import { DotNetIcon, GoLangIcon, JavaIcon, JavaScriptIcon, PhpIcon, PythonIcon, RustIcon } from "~/docs/icons";
import { CodePreview } from "~/components/CodePreview";
import { useActiveConnection } from "~/hooks/connection";
import { connectionUri } from "~/util/helpers";

const LIBRARIES = [
	{
		name: "Rust",
		icon: RustIcon,
		color: "#f46624",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/rust"
	},
	{
		name: "JavaScript",
		icon: JavaScriptIcon,
		color: "#F7DF1E",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/javascript"
	},
	{
		name: "GoLang",
		icon: GoLangIcon,
		color: "#00ADD8",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/golang"
	},
	{
		name: "Python",
		icon: PythonIcon,
		color: "#3776AB",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/python"
	},
	{
		name: ".NET",
		icon: DotNetIcon,
		color: "#512BD4",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/dotnet"
	},
	{
		name: "Java",
		icon: JavaIcon,
		color: "#007396",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/java"
	},
	{
		name: "PHP",
		icon: PhpIcon,
		color: "#777BB4",
		link: "https://github.com/surrealdb/surrealdb.php"
	}
];

export function DocsGlobalIntroduction() {

	const { connection } = useActiveConnection();

	const cliCommand = `$ surreal sql --endpoint ${connectionUri(connection)} --namespace ${connection.namespace} --database ${connection.database}`;

	return (
		<Article title="Surrealist API Docs">
			<div>
				<p>
					SurrealDB offers a rich set of client libraries and connection protocols to make it easy to integrate SurrealDB into your application. This page provides documentation for using these libraries and protocols within the context of your database and schema. You can change the language of the code examples by selecting a different language from the dropdown in the top right corner of this panel.
				</p>
				<Title order={2} mt="xl">
					Client libraries
				</Title>
				<p>
					Client libraries provide the most streamlined way to interact with SurrealDB. They handle the low-level details of the connection and provide a high-level API for interacting with the database. We provide client libraries for a variety of languages, including Rust, JavaScript, Python, and many more.
				</p>
				<Title order={2} mt="xl">
					SurrealDB CLI
				</Title>
				<p>
					When working outside of a programming environment, the SurrealDB CLI provides a convenient way to interact with your database. It provides a simple command-line interface for executing queries and managing your database.
				</p>
			</div>
			<Box>
				<Text
					fz="lg"
					ta="center"
					ff="mono"
					tt="uppercase"
					fw={600}
					mb="sm"
					pl="xs"
					c="bright"
				>
					Client libraries
				</Text>
				<Paper
					p="lg"
					radius="xl"
					withBorder
				>
					<SimpleGrid cols={{
						xs: 1,
						sm: 2,
						md: 3,
						lg: 4,
						xl: 6
					}}>
						{LIBRARIES.map((lib) => {
							const Icon = lib.icon;

							return (
								<Paper
									key={lib.name}
									radius="xl"
									bg="slate.9"
									className={classes.library}
									onClick={() => window.open(lib.link)}
								>
									<Icon />
									<Text mt="xs">
										{lib.name}
									</Text>
								</Paper>
							);
						})}
					</SimpleGrid>
				</Paper>

				<Text
					fz="lg"
					ta="center"
					ff="mono"
					tt="uppercase"
					fw={600}
					mt="xl"
					mb="sm"
					pl="xs"
					c="bright"
				>
					SurrealDB CLI
				</Text>
				<CodePreview
					value={cliCommand}
					withCopy
				/>
				<Text
					ta="center"
					mt="xs"
					c="slate"
				>
					Follow the <Anchor href="https://surrealdb.com/docs/surrealdb/cli">CLI guide</Anchor> for more information on how to use the SurrealDB CLI.
				</Text>
			</Box>
		</Article>
	);
}