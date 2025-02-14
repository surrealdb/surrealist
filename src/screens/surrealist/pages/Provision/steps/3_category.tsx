import { Stack, Text } from "@mantine/core";
import { useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { CategoryPicker } from "~/screens/surrealist/cloud-panel/components/CategoryPicker";
import { StepActions, StepTitle } from "../actions";
import type { ProvisionStepProps } from "../types";

export function ProvisionCategoryStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const organization = useOrganization();

	const updateCategory = (value: string) => {
		setDetails((draft) => {
			draft.category = value;

			if (value === "free") {
				draft.type = "free";
				draft.units = 1;
			} else {
				draft.type = "";
			}
		});
	};

	const handleContinue = useStable(() => {
		onContinue(details.category === "free" ? 5 : undefined);
	});

	return (
		<Stack>
			<StepTitle
				title="Category"
				description="Select a category that best aligns with your project's goals"
			/>

			{organization && (
				<CategoryPicker
					organization={organization}
					value={details.category}
					onChange={updateCategory}
				/>
			)}

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={handleContinue}
				disabled={!details.category}
			/>
		</Stack>
	);
}
