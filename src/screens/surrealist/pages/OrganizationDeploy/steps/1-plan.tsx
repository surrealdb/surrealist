import { Box, Button, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { Icon, iconArrowUpRight } from "@surrealdb/ui";
import { useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "wouter";
import {
	getCloudPlanCardState,
	getCloudPlanDisplayConfig,
	isCloudPlanComingSoon,
	PricingConfigCloud,
	useCloudPricingQuery,
} from "~/cloud/queries/pricing";
import { Spacer } from "~/components/Spacer";
import { useHasCloudFeature } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { PricingCard } from "~/screens/surrealist/components/PricingCard";
import classes from "../style.module.scss";
import { StepProps } from "../types";

export function PlanStep({ organisation, instances, setDetails, setStep }: StepProps) {
	const [search] = useSearchParams();
	const [, setLocation] = useAbsoluteLocation();

	const freeCount = instances.filter((instance) => instance.type.price_hour === 0).length;
	const showFree = freeCount < organisation.max_free_instances;
	const showEnterprise = useHasCloudFeature("distributed_storage");
	const pricingQuery = useCloudPricingQuery();

	const plans = useMemo(() => {
		if (!pricingQuery.isSuccess) {
			return [];
		}

		return pricingQuery.data.cloud.filter(
			(plan) => plan.surrealist && (showFree || plan.surrealist.plan !== "free"),
		);
	}, [pricingQuery.data, pricingQuery.isSuccess, showFree]);

	const onClickPlan = useStable((config: PricingConfigCloud) => {
		if (isCloudPlanComingSoon(config)) {
			return;
		}

		setStep(1);
		setDetails((details) => {
			details.plan = config.surrealist?.plan ?? "free";
			details.startingData = {
				type: details.plan === "free" ? "dataset" : "none",
			};
			details.computeType = config.surrealist?.defaultType ?? "";
		});
	});

	useLayoutEffect(() => {
		const initialPlan = search.get("plan");

		if (!initialPlan || !pricingQuery.data) {
			return;
		}

		const config = pricingQuery.data.cloud.find(
			(plan) => plan.id === initialPlan || plan.surrealist?.plan === initialPlan,
		);

		if (!config || isCloudPlanComingSoon(config)) {
			return;
		}

		if (config.surrealist?.plan === "free" && !showFree) {
			return;
		}

		onClickPlan(config);
	}, [showFree, search, pricingQuery.data]);

	return (
		<>
			<SimpleGrid
				cols={{ base: 1, sm: 2, lg: 3 }}
				spacing="xl"
				className={classes.content}
			>
				{pricingQuery.isSuccess
					? plans.map((plan) => {
							const comingSoon = isCloudPlanComingSoon(plan);

							return (
								<PricingCard
									key={plan.id}
									state={getCloudPlanCardState(plan, showEnterprise)}
									disabled={comingSoon}
									ctaText="Configure instance"
									onClick={(config) => onClickPlan(config as PricingConfigCloud)}
									config={getCloudPlanDisplayConfig(plan, showEnterprise)}
								/>
							);
						})
					: Array.from({ length: 3 }, (_, index) => (
							<Skeleton
								key={index}
								h={650}
							/>
						))}
			</SimpleGrid>

			<Box mt="sm">
				<Text
					c="obsidian"
					className="selectable"
				>
					* Coming soon
				</Text>
			</Box>

			<Group justify="center">
				<Box flex={1}>
					<Button
						color="obsidian"
						variant="light"
						onClick={() => setLocation(`/o/${organisation.id}/instances`)}
					>
						Back
					</Button>
				</Box>
				<Stack
					align="center"
					mt={36}
				>
					<Text className="selectable">
						Looking for more pricing options and information?
					</Text>
					<a
						href="https://surrealdb.com/pricing"
						target="_blank"
						rel="noreferrer"
					>
						<Button
							size="xs"
							color="obsidian"
							variant="light"
							rightSection={<Icon path={iconArrowUpRight} />}
						>
							View pricing information
						</Button>
					</a>
				</Stack>
				<Spacer />
			</Group>
		</>
	);
}
