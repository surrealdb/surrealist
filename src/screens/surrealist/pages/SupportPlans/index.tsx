import { Box, Center, Loader, SimpleGrid } from "@mantine/core";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { useCloudPricingQuery } from "~/cloud/queries/pricing";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { PricingCard } from "~/screens/surrealist/components/PricingCard";
import { orgCrumb } from "~/util/breadcrumbs";
import { dispatchIntent } from "~/util/intents";
import { PageContainer } from "../../components/PageContainer";

export interface SupportPlansPageProps {
	id: string;
}

export function SupportPlansPage({ id }: SupportPlansPageProps) {
	const pricingQuery = useCloudPricingQuery();
	const { data: organisation } = useCloudOrganizationQuery(id);

	const supportPlans = pricingQuery.data?.support ?? [];

	return (
		<>
			{organisation && (
				<PageBreadcrumbs items={[orgCrumb(organisation), { label: "Support plans" }]} />
			)}
			<PageContainer>
				{organisation && (
					<>
						<Box>
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
													subject: "Support plan enquiry",
													message: `Hello! I was interested in learning more about the ${config.name} support plan for my organisation (ID: ${organisation.id}). Could you provide me with more information about the plan? Thanks!`,
													conversationType: "sales-enquiry",
												});
											}}
										/>
									))}
								</SimpleGrid>
							)}
						</Box>
					</>
				)}
			</PageContainer>
		</>
	);
}
