import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps } from "../types";
import { Slider } from "@mantine/core";
import { useOrganizations } from "~/hooks/cloud";

export function ComputeUnitsStep({ details, setDetails }: ProvisionStepProps) {
	const organizations = useOrganizations();
	const organization = organizations.find((org) => org.id === details.organization);
	const instanceType = organization?.plan.instance_types.find((t) => t.slug === details.type);

	if (!instanceType) {
		throw new Error("Instance type not found");
	}

	const updateUnits = useStable((value: number) => {
		setDetails((draft) => {
			draft.units = value;
		});
	});

	const minimum = instanceType.compute_units.min ?? 1;
	const maximum = instanceType.max_storage_size ?? 1;

	const marks = [minimum, maximum].map((value) => ({
		value,
		label: `${value} nodes`,
	}));

	return (
		<Slider
			mb="sm"
			min={minimum}
			max={maximum}
			step={1}
			value={details.units}
			onChange={updateUnits}
			marks={marks}
			label={(value) => `${value} nodes`}
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
