import { Anchor, Group, Paper, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { navigate } from "wouter/use-browser-location";
import { IntercomSupportArticle } from "~/types";

export interface ArticleCardProps {
	article: IntercomSupportArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
	return (
		<Anchor
			variant="glow"
			onClick={() => navigate(`/support/articles/${article.id}`)}
		>
			<Paper
				p="lg"
				radius="md"
				h="100%"
			>
				<Stack
					gap="md"
					h="100%"
				>
					<Stack
						gap="xs"
						flex={1}
					>
						{article.author && (
							<Text
								fz="sm"
								c="violet"
							>
								{article.author.name}
							</Text>
						)}
						<Text
							c="bright"
							fw={600}
							fz="lg"
							lh={1.3}
						>
							{article.title}
						</Text>
						{article.description && (
							<Text
								fz="sm"
								lineClamp={3}
								className="selectable"
							>
								{article.description}
							</Text>
						)}
					</Stack>

					<Group
						gap={4}
						c="var(--mantine-color-violet-light-color)"
						mt="auto"
					>
						<Text
							fz="sm"
							fw={500}
							c="inherit"
						>
							Read article
						</Text>
						<Icon
							path={iconChevronRight}
							size="sm"
						/>
					</Group>
				</Stack>
			</Paper>
		</Anchor>
	);
}
