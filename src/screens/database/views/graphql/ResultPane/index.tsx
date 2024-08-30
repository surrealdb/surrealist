import { CodeEditor } from "~/components/CodeEditor";
import { ContentPane } from "~/components/Pane";
import { useActiveConnection } from "~/hooks/connection";
import { useDatabaseStore } from "~/stores/database";
import { iconQuery } from "~/util/icons";
import { Center, Stack, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { surrealql } from "@surrealdb/codemirror";

export function ResultPane() {
	const connection = useActiveConnection();
	const response = useDatabaseStore((s) => s.graphqlResponse[connection.id]);

	return (
		<ContentPane
			title="Results"
			icon={iconQuery}
		>
			{response?.success ? (
				<CodeEditor
					ml="sm"
					value={response.result || ""}
					readOnly
					extensions={[
						surrealql()
					]}
				/>
			) : response ? (
				<Text c="red">
					{JSON.stringify(response.result)}
				</Text>
			) : (
				<Center h="100%" c="slate">
					<Stack>
						<Icon
							path={iconQuery}
							mx="auto"
							size="lg"
						/>
						Execute a GraphQL query to view the results here
					</Stack>
				</Center>
			)}
		</ContentPane>
	);
}
