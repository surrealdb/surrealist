import {
	Avatar,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconArrowLeft, iconOpen } from "@surrealdb/ui";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import { useSupportArticleQuery } from "~/cloud/queries/context";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { loadingCrumb, supportBreadcrumbs } from "~/util/breadcrumbs";
import { formatRelativeDate } from "~/util/helpers";
import { PageContainer } from "../../../components/PageContainer";

export interface ArticlePageProps {
	id: string;
}

export function ArticlePage({ id }: ArticlePageProps) {
	const { data: article, isLoading } = useSupportArticleQuery(id);

	return (
		<>
			<PageBreadcrumbs
				items={
					isLoading || !article
						? supportBreadcrumbs(loadingCrumb())
						: supportBreadcrumbs(
								{
									label: article.collection?.name ?? "Collection",
									href: `/support/collections/${article.collection?.id}`,
									selectable: true,
								},
								{
									label: article.title ?? "Unnamed Article",
									selectable: true,
								},
							)
				}
			/>
			{isLoading && (
				<Center flex={1}>
					<Loader />
				</Center>
			)}

			{!isLoading && !article && (
				<Center flex={1}>
					<Stack
						gap={0}
						align="center"
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
				</Center>
			)}

			{!isLoading && article && (
				<PageContainer>
					<Box>
						<PrimaryTitle
							fz={32}
							mt="sm"
						>
							{article?.title ?? "Unnamed Article"}
						</PrimaryTitle>
						<Text>{article?.description}</Text>
						<Group
							mt="md"
							mb="lg"
						>
							{article?.author && (
								<Avatar
									size={35}
									name={article.author.name}
									src={article.author.avatar}
									component={UnstyledButton}
									style={{
										cursor: "default",
									}}
								>
									{isLoading && (
										<Loader
											size="sm"
											color="obsidian.4"
										/>
									)}
								</Avatar>
							)}
							<Stack gap={0}>
								<Group gap={4}>
									<Text fz="sm">Written by</Text>
									<Text
										fz="sm"
										fw={600}
										c="surreal"
									>
										{article?.author?.name ?? "SurrealDB Team"}
									</Text>
								</Group>
								<Text
									fz="sm"
									c="obsidian"
								>
									Last updated{" "}
									{formatRelativeDate((article?.updated_at ?? 0) * 1000)}
								</Text>
							</Stack>
						</Group>
					</Box>

					<Paper p="xl">
						{/** biome-ignore lint/security/noDangerouslySetInnerHtml: It's safe since its Intercom */}
						<div dangerouslySetInnerHTML={{ __html: article?.body ?? "" }} />
					</Paper>

					<Group>
						<Button
							color="obsidian"
							variant="light"
							leftSection={<Icon path={iconArrowLeft} />}
							onClick={() =>
								navigate(`/support/collections/${article?.collection?.id}`)
							}
						>
							Go back
						</Button>
						<Spacer />
						<Button
							variant="light"
							color="violet"
							rightSection={<Icon path={iconOpen} />}
							onClick={() => adapter.openUrl(article.url)}
						>
							View on SurrealDB Support
						</Button>
					</Group>
				</PageContainer>
			)}
		</>
	);
}
