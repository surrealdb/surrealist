import { Box, Button, Paper, Text, Title } from "@mantine/core";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { useSetting } from "~/hooks/config";
import { useIsLight } from "~/hooks/theme";
import { Article } from "~/screens/database/docs/components";
import { iconOpen } from "~/util/icons";
import { DRIVERS } from "~/constants";
import { DriverSelector } from "~/components/DriverSelector";

export function DocsGlobalIntroduction() {
	const [language, setLanguage] = useSetting("behavior", "docsLanguage");
	const active = DRIVERS.find((lib) => lib.id === language);

	return (
		<Article>
			<div>
				<p>
					SurrealDB offers a rich set of client libraries and connection protocols to make
					it easy to integrate SurrealDB into your application. This page provides
					documentation for using these libraries and protocols within the context of your
					database and schema. You can change the language of the code examples by
					selecting a different language from the dropdown in the top right corner of this
					panel.
				</p>
				<Title
					order={2}
					mt="xl"
				>
					Client libraries
				</Title>
				<p>
					Client libraries provide the most streamlined way to interact with SurrealDB.
					They handle the low-level details of the connection and provide a high-level API
					for interacting with the database. We provide client libraries for a variety of
					languages, including Rust, JavaScript, Python, and many more.
				</p>
				<Title
					order={2}
					mt="xl"
				>
					Using the CLI
				</Title>
				<p>
					The SurrealDB CLI provides a convenient way to interact with your database on
					the command line. It provides a simple interface for executing queries, which is
					especially useful for limited environments.
				</p>
				{active && (
					<>
						<Title
							order={2}
							mt="xl"
						>
							Learn more
						</Title>
						<p>
							You can learn more about the selected language by visiting the official
							documentation.
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
					<DriverSelector
						value={language}
						onChange={setLanguage}
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
