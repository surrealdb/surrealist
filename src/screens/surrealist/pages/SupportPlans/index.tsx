import { Box, Center, Loader, ScrollArea, SimpleGrid, Stack } from "@mantine/core";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { useCloudPricingQuery } from "~/cloud/queries/pricing";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { PricingCard } from "~/screens/surrealist/components/PricingCard";
import { dispatchIntent } from "~/util/intents";
import classes from "./style.module.scss";

export interface SupportPlansPageProps {
	id: string;
}

export function SupportPlansPage({ id }: SupportPlansPageProps) {
	const pricingQuery = useCloudPricingQuery();
	const { data: organisation } = useCloudOrganizationQuery(id);

	const supportPlans = pricingQuery.data?.support ?? [];

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
					{organisation && (
						<>
							<Box>
								<PageBreadcrumbs
									items={[
										{ label: "Surrealist", href: "/overview" },
										{ label: "Organisations", href: "/organisations" },
										{
											label: organisation.name,
											href: `/o/${organisation.id}`,
										},
										{ label: "Support plans" },
									]}
								/>
								<PrimaryTitle
									mt="sm"
									fz={32}
								>
									Support plans
								</PrimaryTitle>
							</Box>

							<Box my="xl">
								{pricingQuery.isLoading && (
									<Center>
										<Loader />
									</Center>
								)}
								{pricingQuery.isSuccess && (
									<SimpleGrid
										cols={{ base: 1, sm: 2, lg: 3 }}
										spacing="xl"
									>
										{supportPlans.map((support) => (
											<PricingCard
												key={support.id}
												config={support}
												state="contact"
												onClick={(config) => {
													dispatchIntent("create-message", {
														type: "conversation",
														organisation: organisation.id,
														subject: "Support plan inquiry",
														message: `Hello! I was interested in learning more about the ${config.name} support plan for my organisation (ID: ${organisation.id}). Could you provide me with more information about the plan? Thanks!`,
													});
												}}
											/>
										))}
									</SimpleGrid>
								)}
							</Box>
						</>
					)}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
