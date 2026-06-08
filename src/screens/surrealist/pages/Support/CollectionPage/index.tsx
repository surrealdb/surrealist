import { Button, Center, Loader, Stack, Text } from "@mantine/core";
import { Icon, iconArrowLeft } from "@surrealdb/ui";
import { navigate } from "wouter/use-browser-location";
import { useSupportCollectionQuery } from "~/cloud/queries/context";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { loadingCrumb, supportBreadcrumbs } from "~/util/breadcrumbs";
import { PageContainer } from "../../../components/PageContainer";
import { ArticleCard } from "../ArticleCard";
import classes from "../style.module.scss";

export interface CollectionPageProps {
	id: string;
}

export function CollectionPage({ id }: CollectionPageProps) {
	const { data: collection, isLoading } = useSupportCollectionQuery(id);

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

			{!isLoading && collection && collection.articles.length > 0 && (
				<PageContainer>
					<PrimaryTitle fz={32}>{collection.name}</PrimaryTitle>

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
				</PageContainer>
			)}
		</>
	);
}
