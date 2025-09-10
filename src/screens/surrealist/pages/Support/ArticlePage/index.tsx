import {
	Avatar,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import TurndownService from "turndown";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import { useSupportArticleQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { MarkdownContent } from "~/components/MarkdownContent";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { formatRelativeDate } from "~/util/helpers";
import { iconArrowLeft, iconOpen } from "~/util/icons";
import classes from "../style.module.scss";

export interface ArticlePageProps {
	id: string;
}

export function ArticlePage({ id }: ArticlePageProps) {
	const turndown = new TurndownService();
	const { data: article, isLoading } = useSupportArticleQuery(id);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			{isLoading && (
				<Center
					w="100%"
					h="100%"
					flex={1}
				>
					<Loader />
				</Center>
			)}

			{!isLoading && !article && (
				<Center
					w="100%"
					h="100%"
					flex={1}
				>
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
							<Text>{article?.description}</Text>
							<Group
								mt="md"
								mb="lg"
								gap="xs"
							>
								{article?.author && (
									<Avatar
										radius="xl"
										size={30}
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
												color="slate.4"
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
									<Text fz="sm">
										Last updated{" "}
										{formatRelativeDate((article?.updated_at ?? 0) * 1000)}
									</Text>
								</Stack>
							</Group>
						</Box>

						<Paper p="xl">
							<MarkdownContent>
								{turndown.turndown(article.body ?? "")}
							</MarkdownContent>
						</Paper>

						<Group>
							<Button
								color="slate"
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
								rightSection={<Icon path={iconOpen} />}
								onClick={() => adapter.openUrl(article.url)}
							>
								View on SurrealDB Support
							</Button>
						</Group>
					</Stack>
				</ScrollArea>
			)}
		</Box>
	);
}
