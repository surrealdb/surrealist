import { Box, Button, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { useLayoutEffect } from "react";
import { useSearchParams } from "wouter";
import { isInstancePlan } from "~/cloud/helpers";
import { PricingConfigCloud, useCloudPricingQuery } from "~/cloud/queries/pricing";
import { Icon } from "~/components/Icon";
import { useHasCloudFeature } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { PricingCard } from "~/screens/surrealist/components/PricingCard";
import { iconArrowUpRight } from "~/util/icons";
import { StepProps } from "../types";

export function PlanStep({ organisation, instances, setDetails, setStep }: StepProps) {
	const [search] = useSearchParams();

	const freeCount = instances.filter((instance) => instance.type.price_hour === 0).length;
	const showFree = freeCount < organisation.max_free_instances;
	const showEnterprise = useHasCloudFeature("distributed_storage");
	const pricingQuery = useCloudPricingQuery();

	const onClickPlan = useStable((config: PricingConfigCloud) => {
		setStep(1);
		setDetails((details) => {
			details.plan = config.surrealist?.plan ?? "free";
			details.startingData = {
				type: details.plan === "free" ? "dataset" : "none",
			};
			details.type = config.surrealist?.defaultType ?? "";
		});
	});

	useLayoutEffect(() => {
		const initialPlan = search.get("plan");

		if (initialPlan && isInstancePlan(initialPlan)) {
			if (initialPlan === "free" && !showFree) {
				return;
			}

			const config = pricingQuery.data?.cloud?.find((plan) => plan.id === initialPlan);

			if (config) {
				onClickPlan(config);
			}
		}
	}, [showFree, search, pricingQuery.data]);

	return (
		<>
			<SimpleGrid
				cols={{ base: 1, sm: 2, lg: 3 }}
				spacing="xl"
			>
				{showFree &&
					(pricingQuery.isSuccess ? (
						<PricingCard
							state="available"
							ctaText="Configure instance"
							onClick={(config) => onClickPlan(config as PricingConfigCloud)}
							config={pricingQuery.data.cloud?.find(
								(plan) => plan.surrealist?.plan === "free",
							)}
						/>
					) : (
						<Skeleton h={650} />
					))}

				{pricingQuery.isSuccess ? (
					<PricingCard
						state="available"
						ctaText="Configure instance"
						onClick={(config) => onClickPlan(config as PricingConfigCloud)}
						config={pricingQuery.data.cloud?.find(
							(plan) => plan.surrealist?.plan === "start",
						)}
					/>
				) : (
					<Skeleton h={650} />
				)}

				{pricingQuery.isSuccess ? (
					<PricingCard
						state="future"
						ctaText="Configure instance"
						onClick={(config) => onClickPlan(config as PricingConfigCloud)}
						config={pricingQuery.data.cloud?.find(
							(plan) => plan.surrealist?.plan === "scale",
						)}
					/>
				) : (
					<Skeleton h={650} />
				)}

				{pricingQuery.isSuccess ? (
					<PricingCard
						state={showEnterprise ? "available" : "contact"}
						ctaText="Configure instance"
						onClick={(config) => onClickPlan(config as PricingConfigCloud)}
						config={
							{
								...pricingQuery.data.cloud?.find(
									(plan) => plan.surrealist?.plan === "enterprise",
								),
								price: showEnterprise
									? "Available"
									: pricingQuery.data.cloud?.find(
											(plan) => plan.surrealist?.plan === "enterprise",
										)?.price,
							} as PricingConfigCloud
						}
					/>
				) : (
					<Skeleton h={650} />
				)}
			</SimpleGrid>

			<Box mt="sm">
				<Text c="slate">* Coming soon</Text>
			</Box>

			<Stack
				align="center"
				mt={36}
			>
				<Text>Looking for more pricing options and information?</Text>
				<a
					href="https://surrealdb.com/pricing"
					target="_blank"
					rel="noreferrer"
				>
					<Button
						size="xs"
						color="slate"
						variant="light"
						rightSection={<Icon path={iconArrowUpRight} />}
					>
						View pricing information
					</Button>
				</a>
			</Stack>
		</>
	);
}
