import { Group, Paper, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Article } from "~/screens/database/docs/components";
import type { TopicProps } from "~/screens/database/docs/types";
import { iconTable } from "~/util/icons";

export function DocsTablesInfo({ topic }: TopicProps) {
	return (
		<Article>
			<Paper mt="lg" p="md">
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
