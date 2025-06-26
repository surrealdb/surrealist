import classes from "../style.module.scss";

import { Box, Button, Checkbox, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import clsx from "clsx";
import { InstancePlanInfo, useCloudPlansQuery } from "~/cloud/queries/plans";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useHasCloudFeature } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { InstancePlan } from "~/types";
import { CURRENCY_FORMAT } from "~/util/helpers";
import { iconArrowLeft, iconArrowUpRight } from "~/util/icons";
import { StepProps } from "../types";

export function PlanStep({ organisation, instances, setDetails, setStep }: StepProps) {
	const freeCount = instances.filter((instance) => instance.type.price_hour === 0).length;
	const showFree = freeCount < organisation.max_free_instances;
	const showEnterprise = useHasCloudFeature("distributed_storage");

	const { data } = useCloudPlansQuery();

	const onClickPlan = useStable(({ surrealist }: InstancePlanInfo) => {
		setStep(1);
		setDetails((details) => {
			details.plan = surrealist.plan as InstancePlan;
			details.dataset = surrealist.dataset ?? false;
			details.type = surrealist.defaultType ?? "";
		});
	});

	return (
		<>
			<SimpleGrid
				cols={{ base: 1, sm: 2, lg: showFree ? 4 : 3 }}
				spacing="xl"
			>
				{showFree && data?.free && (
					<PlanCard
						plan={data.free}
						state="available"
						onConfigure={onClickPlan}
					/>
				)}
				{data?.start && (
					<PlanCard
						plan={data.start}
						state="available"
						onConfigure={onClickPlan}
					/>
				)}
				{data?.scale && (
					<PlanCard
						plan={data.scale}
						state="future"
						onConfigure={onClickPlan}
					/>
				)}
				{data?.enterprise && (
					<PlanCard
						plan={data.enterprise}
						state={showEnterprise ? "available" : "contact"}
						onConfigure={onClickPlan}
					/>
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
	plan: InstancePlanInfo;
	state: PlanCardState;
	recommended?: boolean;
	onConfigure: (plan: InstancePlanInfo) => void;
}

function PlanCard({ plan, state, recommended, onConfigure }: PlanCardProps) {
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
					onConfigure(plan);
				} else if (state === "contact") {
					window.open("https://surrealdb.com/contact", "_blank");
				}
			}}
		>
			<Stack h="100%">
				<Box>
					<Text fz={22}>{plan.name}</Text>
					{state === "contact" ? (
						<PrimaryTitle fz={22}>Contact us</PrimaryTitle>
					) : state === "future" ? (
						<PrimaryTitle fz={22}>Coming soon</PrimaryTitle>
					) : (
						<>
							{typeof plan.price === "number" ? (
								<Group
									align="end"
									gap="xs"
								>
									<Text
										size="md"
										lh={2.25}
									>
										From
									</Text>
									<PrimaryTitle fz={22}>
										{CURRENCY_FORMAT.format(plan.price)}
									</PrimaryTitle>
									<Text
										size="md"
										lh={2.25}
									>
										/ per hour
									</Text>
								</Group>
							) : (
								<PrimaryTitle fz={22}>Available</PrimaryTitle>
							)}
						</>
					)}
				</Box>
				<Text>{plan.description}</Text>
				<Label mt="xl">What you get</Label>
				<Stack>
					{plan.features.map((feature) => (
						<Group
							gap="sm"
							c="bright"
							key={feature}
						>
							<Checkbox
								checked
								size="xs"
							/>
							{feature}
						</Group>
					))}
				</Stack>
				<Label mt="xl">Resources</Label>
				<Stack>
					{plan.resources.map((resource) => (
						<Group
							gap="sm"
							c="bright"
							key={resource}
						>
							<Checkbox
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
