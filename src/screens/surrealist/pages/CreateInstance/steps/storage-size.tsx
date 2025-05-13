import { Slider } from "@mantine/core";
import { list } from "radash";
import { useStable } from "~/hooks/stable";
import { formatMemory } from "~/util/helpers";
import type { ProvisionStepProps } from "../types";

export function StorageSizeStep({ details, setDetails }: ProvisionStepProps) {
	const updateAmount = useStable((value: number) => {
		setDetails((draft) => {
			draft.storageAmount = value;
		});
	});

	const isStandard = details.storageCategory === "standard";
	const minimum = 100;
	const maximum = isStandard ? 1000 : 6000;
	const segments = isStandard ? list(100, 1000, (i) => i, 100) : list(0, 6000, (i) => i, 1000);

	const marks = segments.map((value) => ({
		value,
		label: formatMemory(Math.max(value, 100) * 1000, true),
	}));

	return (
		<Slider
			mb="sm"
			min={minimum}
			max={maximum}
			step={100}
			value={details.storageAmount}
			onChange={updateAmount}
			marks={marks}
			label={(value) => formatMemory(value * 1000, true)}
			color="slate"
			styles={{
				label: {
					paddingInline: 10,
					fontSize: "var(--mantine-font-size-md)",
					fontWeight: 600,
				},
			}}
		/>
	);
}
