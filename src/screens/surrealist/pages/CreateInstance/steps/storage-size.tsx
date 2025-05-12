import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps } from "../types";
import { Paper, Slider } from "@mantine/core";
import { useOrganizations } from "~/hooks/cloud";

export function StorageSizeStep({ details, setDetails }: ProvisionStepProps) {
	const organizations = useOrganizations();
	const organization = organizations.find((org) => org.id === details.organization);
	const instanceType = organization?.plan.instance_types.find((t) => t.slug === details.type);

	if (!instanceType) {
		throw new Error("Instance type not found");
	}

	const updateAmount = useStable((value: number) => {
		setDetails((draft) => {
			draft.storage_amount = value;
		});
	});

	const minimum = 1;
	const maximum = instanceType.max_storage_size;

	const marks = [minimum, maximum].map((value) => ({
		value,
		label: `${value} GB`,
	}));

	return (
		<Slider
			mb="sm"
			min={minimum}
			max={maximum}
			step={1}
			value={details.storage_amount}
			onChange={updateAmount}
			marks={marks}
			label={(value) => `${value} GB`}
			color="slate"
			styles={{
				label: {
					paddingInline: 10,
					fontSize: "var(--mantine-font-size-lg)",
					fontWeight: 600,
				},
			}}
		/>
	);
}
