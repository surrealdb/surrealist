import { Box, Group, List, Paper, SimpleGrid, Text } from "@mantine/core";
import { StepProps } from "../types";
import { usePlans } from "~/hooks/plan";

export function PlanStep({ setDetails, setStep }: StepProps) {

	// TODO Only show free when available
	const showFree = true;
	const plans = usePlans(showFree);

	const map = {
		"cloud-free": {
			dataset: true,
			type: "free",
			plan: "free"
		},
		"cloud-start": {
			type: "",
			plan: "start",
			dataset: false
		},
		"cloud-scale": {
			type: "",
			plan: "scale",
			dataset: false
		},
		"cloud-enterprise": {
			type: "",
			plan: "enterprise",
			dataset: false
		}
	} as const;

	const onClickPlan = (planId: keyof typeof map) => {
		setDetails((details) => {
			const planDetails = map[planId];
			details.plan = planDetails.plan;
			details.type = planDetails.type;
			details.dataset = planDetails.dataset || false;
		});
		setStep(1);
	};

	return (
		<>
			<SimpleGrid cols={4}>
				{plans.data?.map((plan) => (
					<Paper
						key={plan.id}
						p="xl"
						onClick={() => onClickPlan(plan.id as keyof typeof map)}
						variant="interactive"
					>
						<Box mih={150}>
							<Text size="2rem" fw={500}>{plan.name}</Text>
							<Text size="xl" mt="xs">
								{typeof plan.price === "number" ? (
									<>
										<Text component="span" size="lg" c="dimmed">
											Starting at
										</Text>
										<Group align="center" gap="xs">
											<Text component="span" fw="bold" size="1.45rem">
												${plan.price.toFixed(2).toString()}
											</Text>
											<Text component="span" size="md" c="dimmed">
												per hour
											</Text>
										</Group>
									</>
								) : plan.price}
							</Text>
							<Text size="lg" mt="xs">
								{plan.description}
							</Text>
						</Box>
						<Box mih={400}>
							<Text size="lg" mt="xl" fw="bold">
								{plan.featuresTitle}
							</Text>
							<List>
								{plan.features.map((feature, index) => (
									<List.Item mt="xs" key={feature}>
										{feature}
									</List.Item>
								))}
							</List>
							<Text size="lg" mt="xl" fw="bold">
								Resources
							</Text>
							<List>
								{plan.resources.map((resource) => (
									<List.Item mt="xs" key={resource}>
										{resource}
									</List.Item>
								))}
							</List>
						</Box>
						<Text size="lg" mt="xl" fw="bold">
							Plus
						</Text>
						<List>
							{plan.plus?.map((plus) => (
								<List.Item mt="xs" key={plus}>
									{plus}
								</List.Item>
							))}
						</List>
					</Paper>
				))}
			</SimpleGrid>
		</>
	);
}