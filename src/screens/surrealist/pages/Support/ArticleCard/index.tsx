import { Group, Paper, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { navigate } from "wouter/use-browser-location";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { IntercomSupportArticle } from "~/types";

export interface ArticleCardProps {
	article: IntercomSupportArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
	return (
		<Paper
			p="lg"
			radius="md"
			variant="interactive"
			onClick={() => navigate(`/support/articles/${article.id}`)}
		>
			<Group wrap="nowrap">
				<Stack gap="xs">
					<PrimaryTitle fz="xl">{article.title}</PrimaryTitle>
					<Text>{article.description}</Text>
				</Stack>
				<Spacer />
				<Icon
					path={iconChevronRight}
					ml="md"
				/>
			</Group>
		</Paper>
	);
}
