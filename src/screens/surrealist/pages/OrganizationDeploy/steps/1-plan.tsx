import { Paper, SimpleGrid } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { StepProps } from "../types";

export function PlanStep({ setDetails, setStep }: StepProps) {
	// TODO Only show free when available
	const showFree = true;

	return (
		<>
			<SimpleGrid cols={4}>
				{showFree && (
					<Paper
						p="xl"
						variant="interactive"
						onClick={() => {
							setStep(1);
							setDetails((details) => {
								details.plan = "free";
								details.type = "free";
								details.dataset = true;
							});
						}}
					>
						<PrimaryTitle>Free</PrimaryTitle>
					</Paper>
				)}
				<Paper
					p="xl"
					variant="interactive"
					onClick={() => {
						setStep(1);
						setDetails((details) => {
							details.plan = "start";
							details.type = "";
						});
					}}
				>
					<PrimaryTitle>Start</PrimaryTitle>
				</Paper>
				<Paper
					p="xl"
					variant="gradient"
				>
					<PrimaryTitle>Scale</PrimaryTitle>
				</Paper>
				<Paper
					p="xl"
					variant="interactive"
					onClick={() => {
						setStep(1);
						setDetails((details) => {
							details.plan = "enterprise";
							details.type = "";
						});
					}}
				>
					<PrimaryTitle>Enterprise</PrimaryTitle>
				</Paper>
			</SimpleGrid>
		</>
	);
}
