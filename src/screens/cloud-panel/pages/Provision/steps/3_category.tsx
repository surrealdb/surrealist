import { Stack, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { InstanceCategoryPicker } from "~/screens/cloud-panel/components/InstanceCategoryPicker";
import { StepActions } from "../actions";
import type { ProvisionStepProps } from "../types";

export function ProvisionCategoryStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const organization = useOrganization();
	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;

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
			<PrimaryTitle>Select instance category</PrimaryTitle>

			<Text mb="lg">
				Optimise your experience by selecting the instance category that best aligns with
				your project's goals.
			</Text>

			{organization && (
				<InstanceCategoryPicker
					organization={organization}
					value={details.category}
					onChange={updateCategory}
				/>
			)}

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={handleContinue}
				disabled={!details.category || (details.category !== "free" && !hasBilling)}
			/>
		</Stack>
	);
}
