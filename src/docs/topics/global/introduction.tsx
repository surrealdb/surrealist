import classes from "../../style.module.scss";
import { Article } from "~/docs/components";
import { Box, Button, Paper, SimpleGrid, Text, Title } from "@mantine/core";
import {
	DotNetIcon,
	JavaScriptIcon,
	PythonIcon,
	RustIcon,
	SurrealIcon,
} from "~/docs/icons";
import { useActiveConnection } from "~/hooks/connection";
import { useSetting } from "~/hooks/config";
import { CodeLang } from "~/types";
import clsx from "clsx";
import { Icon } from "~/components/Icon";
import { iconOpen } from "~/util/icons";
import { adapter } from "~/adapter";

interface Library {
	id: CodeLang;
	name: string;
	icon: React.FC<{ active?: boolean }>;
	color: string;
	link: string;
}

const LIBRARIES: Library[] = [
	{
		id: "cli",
		name: "CLI",
		icon: SurrealIcon,
		color: "#FF00A0",
		link: "https://surrealdb.com/docs/surrealdb/cli",
	},
	{
		id: "rust",
		name: "Rust",
		icon: RustIcon,
		color: "#f46624",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/rust",
	},
	{
		id: "js",
		name: "JavaScript",
		icon: JavaScriptIcon,
		color: "#F7DF1E",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/javascript",
	},
	// {
	// 	id: "golang",
	// 	name: "GoLang",
	// 	icon: GoLangIcon,
	// 	color: "#00ADD8",
	// 	link: "https://surrealdb.com/docs/surrealdb/integration/sdks/golang"
	// },
	{
		id: "py",
		name: "Python",
		icon: PythonIcon,
		color: "#3776AB",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/python",
	},
	{
		id: "csharp",
		name: ".NET",
		icon: DotNetIcon,
		color: "#512BD4",
		link: "https://surrealdb.com/docs/surrealdb/integration/sdks/dotnet",
	},
	// {
	// 	id: "java",
	// 	name: "Java",
	// 	icon: JavaIcon,
	// 	color: "#007396",
	// 	link: "https://surrealdb.com/docs/surrealdb/integration/sdks/java"
	// },
	// {
	// 	id: "php",
	// 	name: "PHP",
	// 	icon: PhpIcon,
	// 	color: "#777BB4",
	// 	link: "https://github.com/surrealdb/surrealdb.php"
	// }
];

export function DocsGlobalIntroduction() {
	const [language, setLanguage] = useSetting("behavior", "docsLanguage");
	const { connection } = useActiveConnection();

	const active = LIBRARIES.find((lib) => lib.id === language);

	return (
		<Article>
			<div>
				<p>
					SurrealDB offers a rich set of client libraries and
					connection protocols to make it easy to integrate SurrealDB
					into your application. This page provides documentation for
					using these libraries and protocols within the context of
					your database and schema. You can change the language of the
					code examples by selecting a different language from the
					dropdown in the top right corner of this panel.
				</p>
				<Title order={2} mt="xl">
					Client libraries
				</Title>
				<p>
					Client libraries provide the most streamlined way to
					interact with SurrealDB. They handle the low-level details
					of the connection and provide a high-level API for
					interacting with the database. We provide client libraries
					for a variety of languages, including Rust, JavaScript,
					Python, and many more.
				</p>
				<Title order={2} mt="xl">
					Using the CLI
				</Title>
				<p>
					When working outside of a programming environment, the
					SurrealDB CLI provides a convenient way to interact with
					your database. It provides a simple command-line interface
					for executing queries, which is especially useful for
					limited environments.
				</p>
				{active && (
					<>
						<Title order={2} mt="xl">
							Learn more
						</Title>
						<p>
							You can learn more about the selected language by
							visiting the official documentation.
						</p>
						<Button
							variant="gradient"
							rightSection={<Icon path={iconOpen} />}
							onClick={() => adapter.openUrl(active.link)}
							size="xs"
							radius="sm"
						>
							Visit {active.name} docs
						</Button>
					</>
				)}
			</div>
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
				<Paper radius="xl">
					<SimpleGrid
						cols={{
							xs: 1,
							sm: 2,
							md: 3,
							lg: 4,
							xl: 6,
						}}
					>
						{LIBRARIES.map((lib) => {
							const Icon = lib.icon;
							const isActive = language === lib.id;

							return (
								<Paper
									key={lib.name}
									radius="xl"
									bg="slate.9"
									className={clsx(
										classes.library,
										isActive && classes.libraryActive
									)}
									onClick={() => setLanguage(lib.id)}
								>
									<Icon active={isActive} />
									<Text mt="xs">{lib.name}</Text>
								</Paper>
							);
						})}
					</SimpleGrid>
				</Paper>
			</Box>
		</Article>
	);
}
