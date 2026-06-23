import { Box, Button, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { Icon, iconArrowUpRight } from "@surrealdb/ui";
import { useLayoutEffect } from "react";
import { useSearchParams } from "wouter";
import { isInstancePlan, isScalePlan } from "~/cloud/helpers";
import { PricingConfigCloud, useCloudPricingQuery } from "~/cloud/queries/pricing";
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
	const canDeployScale = useHasCloudFeature("create_instances_scale");
	const pricingQuery = useCloudPricingQuery();
	const cloudPlans = pricingQuery.data?.cloud;
	const scaleConfig = cloudPlans?.find((plan) => plan.surrealist?.plan === "scale");

	const onClickPlan = useStable((config: PricingConfigCloud) => {
		setStep(1);
		setDetails((details) => {
			const plan = config.surrealist?.plan ?? "free";

			details.plan = plan;
			details.startingData = {
				type: plan === "free" ? "dataset" : "none",
			};
			details.computeType = config.surrealist?.defaultType ?? "";
			details.computeUnits = isScalePlan(plan) ? 3 : 1;
			details.storageUnits = 3;
		});
	});

	useLayoutEffect(() => {
		const initialPlan = search.get("plan");

		if (initialPlan && isInstancePlan(initialPlan)) {
			if (initialPlan === "free" && !showFree) {
				return;
			}

			if (isScalePlan(initialPlan) && !canDeployScale) {
				return;
			}

			const config = cloudPlans?.find((plan) => plan.surrealist?.plan === initialPlan);

			if (config) {
				onClickPlan(config);
			}
		}
	}, [showFree, canDeployScale, search, cloudPlans]);

	return (
		<>
			<SimpleGrid
				cols={{ base: 1, sm: 2, lg: 3 }}
				spacing="xl"
				className={classes.content}
			>
				{pricingQuery.isSuccess ? (
					<>
						{showFree && (
							<PricingCard
								state="available"
								ctaText="Configure instance"
								onClick={(config) => onClickPlan(config as PricingConfigCloud)}
								config={cloudPlans?.find(
									(plan) => plan.surrealist?.plan === "free",
								)}
							/>
						)}

						<PricingCard
							state="available"
							ctaText="Configure instance"
							onClick={(config) => onClickPlan(config as PricingConfigCloud)}
							config={cloudPlans?.find((plan) => plan.surrealist?.plan === "start")}
						/>

						{scaleConfig && (
							<PricingCard
								state={canDeployScale ? "available" : "contact"}
								ctaText="Configure instance"
								onClick={(config) => onClickPlan(config as PricingConfigCloud)}
								config={scaleConfig}
							/>
						)}
					</>
				) : (
					<>
						{showFree && <Skeleton h={650} />}
						<Skeleton h={650} />
						<Skeleton h={650} />
						<Skeleton h={650} />
					</>
				)}
			</SimpleGrid>

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
