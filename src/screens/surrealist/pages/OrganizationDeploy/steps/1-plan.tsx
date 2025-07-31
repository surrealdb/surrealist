import {
	Box,
	Button,
	Checkbox,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from "@mantine/core";
import clsx from "clsx";
import { useLayoutEffect } from "react";
import { useSearchParams } from "wouter";
import { adapter } from "~/adapter";
import { isInstancePlan } from "~/cloud/helpers";
import { PlanConfig, useCloudPlansQuery } from "~/cloud/queries/plans";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useHasCloudFeature } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { CURRENCY_FORMAT } from "~/util/helpers";
import { iconArrowLeft, iconArrowUpRight } from "~/util/icons";
import classes from "../style.module.scss";
import { StepProps } from "../types";

export function PlanStep({ organisation, instances, setDetails, setStep }: StepProps) {
	const [search] = useSearchParams();

	const freeCount = instances.filter((instance) => instance.type.price_hour === 0).length;
	const showFree = freeCount < organisation.max_free_instances;
	const showEnterprise = useHasCloudFeature("distributed_storage");
	const planQuery = useCloudPlansQuery();

	const onClickPlan = useStable((config: PlanConfig) => {
		setStep(1);
		setDetails((details) => {
			details.plan = config.plan;
			details.startingData = config.startingData;
			details.type = config.defaultType ?? "";
		});
	});

	useLayoutEffect(() => {
		const initialPlan = search.get("plan");

		if (initialPlan && isInstancePlan(initialPlan)) {
			if (initialPlan === "free" && !showFree) {
				return;
			}

			const config = planQuery.data?.[initialPlan];

			if (config) {
				onClickPlan(config);
			}
		}
	}, [showFree, search, planQuery.data]);

	return (
		<>
			<SimpleGrid
				cols={{ base: 1, sm: 2, lg: showFree ? 4 : 3 }}
				spacing="xl"
			>
				{showFree &&
					(planQuery.isSuccess ? (
						<PlanCard
							state="available"
							onConfigure={onClickPlan}
							config={planQuery.data.free}
						/>
					) : (
						<Skeleton h={650} />
					))}

				{planQuery.isSuccess ? (
					<PlanCard
						state="available"
						onConfigure={onClickPlan}
						config={planQuery.data.start}
					/>
				) : (
					<Skeleton h={650} />
				)}

				{planQuery.isSuccess ? (
					<PlanCard
						state="future"
						onConfigure={onClickPlan}
						config={planQuery.data.scale}
					/>
				) : (
					<Skeleton h={650} />
				)}

				{planQuery.isSuccess ? (
					<PlanCard
						state={showEnterprise ? "available" : "contact"}
						onConfigure={onClickPlan}
						config={{
							...planQuery.data.enterprise,
							price: showEnterprise ? "Available" : planQuery.data.enterprise.price,
						}}
					/>
				) : (
					<Skeleton h={650} />
				)}
			</SimpleGrid>

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

export type PlanCardState = "available" | "future" | "contact";

export interface PlanCardProps {
	config: PlanConfig;
	state: PlanCardState;
	recommended?: boolean;
	onConfigure: (config: PlanConfig) => void;
}

function PlanCard({ config, state, recommended, onConfigure }: PlanCardProps) {
	return (
		<Paper
			p="xl"
			role="button"
			tabIndex={0}
			variant={state === "future" ? "gradient" : "interactive"}
			className={clsx(
				recommended && classes.planRecommended,
				state === "future" && classes.planDisabled,
			)}
			onClick={() => {
				if (state === "available") {
					onConfigure(config);
				} else if (state === "contact") {
					adapter.openUrl("https://surrealdb.com/contact");
				}
			}}
		>
			<Stack h="100%">
				<Box>
					<Text fz={22}>{config.name}</Text>
					{state === "contact" ? (
						<PrimaryTitle fz={22}>Contact us</PrimaryTitle>
					) : state === "future" ? (
						<PrimaryTitle fz={22}>Coming soon</PrimaryTitle>
					) : config.price === 0 ? (
						<PrimaryTitle fz={22}>Free</PrimaryTitle>
					) : typeof config.price === "string" ? (
						<PrimaryTitle fz={22}>{config.price}</PrimaryTitle>
					) : (
						<Box>
							<Group
								align="end"
								gap="xs"
							>
								<Text
									size="md"
									lh={2.25}
								>
									Starts at
								</Text>
								<PrimaryTitle fz={22}>
									{CURRENCY_FORMAT.format(config.price)}
								</PrimaryTitle>
								<Text
									size="md"
									lh={2.25}
								>
									/ per hour
								</Text>
							</Group>
						</Box>
					)}
				</Box>
				<Text>{config.description}</Text>
				<Label mt="xl">What you get</Label>
				<Stack>
					{config.features.map((feature) => (
						<Group
							gap="sm"
							c="bright"
							key={feature}
						>
							<Checkbox
								readOnly
								checked
								size="xs"
							/>
							{feature}
						</Group>
					))}
				</Stack>
				<Label mt="xl">Resources</Label>
				<Stack>
					{config.resources.map((resource) => (
						<Group
							gap="sm"
							c="bright"
							key={resource}
						>
							<Checkbox
								readOnly
								checked
								size="xs"
							/>
							{resource}
						</Group>
					))}
				</Stack>
				<Spacer />
				<Group
					mt="md"
					gap="xs"
					justify="end"
					c={state === "future" ? "slate" : "surreal"}
				>
					<Text inherit>
						{state === "available"
							? "Configure instance"
							: state === "future"
								? "Coming soon"
								: "Contact us"}
					</Text>
					<Icon
						className={classes.startBlogArrow}
						path={iconArrowLeft}
						flip="horizontal"
					/>
				</Group>
			</Stack>
		</Paper>
	);
}
