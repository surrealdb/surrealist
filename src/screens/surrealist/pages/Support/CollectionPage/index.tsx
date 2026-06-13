import { Button, Center, Loader, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon, iconArrowLeft } from "@surrealdb/ui";
import { navigate } from "wouter/use-browser-location";
import { useSupportCollectionQuery } from "~/cloud/queries/context";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { loadingCrumb, supportBreadcrumbs } from "~/util/breadcrumbs";
import { plural } from "~/util/helpers";
import { PageContainer } from "../../../components/PageContainer";
import { ArticleCard } from "../ArticleCard";
import classes from "../style.module.scss";

export interface CollectionPageProps {
	id: string;
}

export function CollectionPage({ id }: CollectionPageProps) {
	const { data: collection, isLoading } = useSupportCollectionQuery(id);

	const articles = collection?.articles.sort((a, b) => a.created_at - b.created_at) ?? [];

	return (
		<>
			<PageBreadcrumbs
				items={supportBreadcrumbs(
					isLoading || !collection
						? loadingCrumb()
						: { label: collection.name, selectable: true },
				)}
			/>
			{isLoading && (
				<Center flex={1}>
					<Loader />
				</Center>
			)}

			{!isLoading && !collection && (
				<Center flex={1}>
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

			{!isLoading && collection && articles.length > 0 && (
				<PageContainer>
					<Stack gap="xs">
						<PrimaryTitle fz={32}>{collection.name}</PrimaryTitle>
						{collection.description && (
							<Text
								maw={720}
								className="selectable"
							>
								{collection.description}
							</Text>
						)}
						<Text fz="sm">
							{articles.length} {plural(articles.length, "article")}
						</Text>
					</Stack>

					<SimpleGrid
						mt="xl"
						cols={{ base: 1, sm: 2 }}
						spacing="lg"
						className={classes.content}
					>
						{articles.map((article) => (
							<ArticleCard
								key={article.id}
								article={article}
							/>
						))}
					</SimpleGrid>
				</PageContainer>
			)}
		</>
	);
}
