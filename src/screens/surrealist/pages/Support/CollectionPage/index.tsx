import { Box, Button, Center, Loader, ScrollArea, Stack, Text } from "@mantine/core";
import { navigate } from "wouter/use-browser-location";
import { useSupportCollectionQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconArrowLeft } from "~/util/icons";
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
								{ label: collection?.name ?? "Collection" },
							]}
						/>
						<PrimaryTitle
							fz={32}
							mt="sm"
						>
							{collection?.name ?? "Collection"}
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

					<Stack gap="lg">
						{!isLoading &&
							collection?.articles &&
							collection?.articles.length > 0 &&
							collection?.articles
								.sort((a, b) => a.created_at - b.created_at)
								.map((article) => (
									<ArticleCard
										key={article.id}
										article={article}
									/>
								))}
					</Stack>

					{!isLoading && (!collection?.articles || collection?.articles.length === 0) && (
						<Stack
							align="center"
							gap={0}
						>
							<PrimaryTitle>Collection not found</PrimaryTitle>
							<Text>
								The collection you are looking for does not exist or has no content.
							</Text>
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
