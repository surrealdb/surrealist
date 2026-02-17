import { Box, Button, Center, Loader, ScrollArea, Stack, Text } from "@mantine/core";
import { Icon, iconArrowLeft } from "@surrealdb/ui";
import { navigate } from "wouter/use-browser-location";
import { useSupportCollectionQuery } from "~/cloud/queries/context";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { ArticleCard } from "../ArticleCard";
import classes from "../style.module.scss";

export interface CollectionPageProps {
	id: string;
}

export function CollectionPage({ id }: CollectionPageProps) {
	const { data: collection, isLoading } = useSupportCollectionQuery(id);

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

			{!isLoading && !collection && (
				<Center
					w="100%"
					h="100%"
					flex={1}
				>
					<Stack
						gap={0}
						align="center"
					>
						<PrimaryTitle>Collection not found</PrimaryTitle>
						<Text>The collection you are looking for does not exist or is empty</Text>
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

			{!isLoading && collection && collection.articles.length > 0 && (
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
						maw={1000}
						pb={68}
					>
						<Box>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{ label: "Support", href: "/support" },
									{ label: collection.name },
								]}
							/>
							<PrimaryTitle
								fz={32}
								mt="sm"
							>
								{collection.name}
							</PrimaryTitle>
						</Box>

						<Stack
							gap="lg"
							className={classes.content}
						>
							{collection.articles
								.sort((a, b) => a.created_at - b.created_at)
								.map((article) => (
									<ArticleCard
										key={article.id}
										article={article}
									/>
								))}
						</Stack>
					</Stack>
				</ScrollArea>
			)}
		</Box>
	);
}
