import { Paper, SimpleGrid } from "@mantine/core";
import { StepProps } from "../types";

export function PlanStep({ organisation, setStep }: StepProps) {
	return (
		<>
			<SimpleGrid cols={4}>
				<Paper
					p="xl"
					onClick={() => setStep(1)}
				>
					Free
				</Paper>
				<Paper
					p="xl"
					onClick={() => setStep(1)}
				>
					Grow
				</Paper>
				<Paper
					p="xl"
					onClick={() => setStep(1)}
				>
					Scale
				</Paper>
				<Paper
					p="xl"
					onClick={() => setStep(1)}
				>
					Enterprise
				</Paper>
			</SimpleGrid>
		</>
	);
}
