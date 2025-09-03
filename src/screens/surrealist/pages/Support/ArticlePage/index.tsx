import { Box, Button, Center, Loader, ScrollArea, Stack, Text } from "@mantine/core";
import { navigate } from "wouter/use-browser-location";
import { useSupportArticleQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconArrowLeft } from "~/util/icons";
import classes from "../style.module.scss";

export interface ArticlePageProps {
	id: string;
}

export function ArticlePage({ id }: ArticlePageProps) {
	const { data: article, isLoading } = useSupportArticleQuery(id);

	console.log(article);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				mt={18}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					pb={68}
				>
					<Box>
						<PageBreadcrumbs
							items={[
								{ label: "Surrealist", href: "/overview" },
								{ label: "Support", href: "/support" },
								{
									label: article?.collection?.name ?? "Collection",
									href: `/support/collections/${article?.collection?.id}`,
								},
								{ label: article?.title ?? "Unnamed Article" },
							]}
						/>
						<PrimaryTitle
							fz={32}
							mt="sm"
						>
							{article?.title ?? "Unnamed Article"}
						</PrimaryTitle>
					</Box>

					{isLoading && (
						<Center
							my="auto"
							mx="auto"
							flex={1}
						>
							<Loader />
						</Center>
					)}

					{/** biome-ignore lint/security/noDangerouslySetInnerHtml: Intercom only returns as raw HTML */}
					<div dangerouslySetInnerHTML={{ __html: article?.body ?? "" }} />

					{!isLoading && !article && (
						<Stack
							align="center"
							gap={0}
						>
							<PrimaryTitle>Article not found</PrimaryTitle>
							<Text>The article you are looking for does not exist</Text>
							<Button
								mt="xl"
								size="sm"
								variant="gradient"
								leftSection={<Icon path={iconArrowLeft} />}
								onClick={() => navigate("/support")}
							>
								Back to Support
							</Button>
						</Stack>
					)}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
