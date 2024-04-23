import { Group, Paper, Text } from "@mantine/core";
import { Article } from "~/docs/components";
import { TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";
import { Icon } from "~/components/Icon";
import { iconTable } from "~/util/icons";

export function DocsTablesInfo({ topic }: TopicProps) {

	const schema = useSchema();
	const { connection } = useActiveConnection();

	return (
		<Article>
			<Paper
				mt="lg"
				bg="slate.9"
				p="md"
			>
				<Group c="bright">
					<Icon path={iconTable} size="sm" />
					<Text fz="xl" ff="mono">
						{topic.extra?.table?.schema?.name}
					</Text>
				</Group>
			</Paper>
		</Article>
	);
}
