import { Box, Slider, Text } from "@mantine/core";
import { list } from "radash";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { DeploySectionProps } from "../types";

export function ClusterOptionsSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);

	const updateUnits = useStable((value: number) => {
		setDetails((draft) => {
			draft.units = value;
		});
	});

	const instanceType = instanceTypes.get(details.type);
	const computeMinimum = instanceType?.compute_units.min ?? 1;
	const computeMaximum = instanceType?.compute_units.max ?? 1;
	const computeSegments = list(computeMinimum, computeMaximum);

	const computeMarks = computeSegments.map((value) => ({
		value,
		label: `${value} nodes`,
	}));

	return (
		<>
			<Box>
				<PrimaryTitle>Compute nodes</PrimaryTitle>
				<Text>Select the number of compute nodes for your cluster.</Text>
			</Box>

			<Slider
				mt="xs"
				h={40}
				min={computeMinimum}
				max={computeMaximum}
				step={1}
				value={details.units}
				onChange={updateUnits}
				marks={computeMarks}
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
		</>
	);
}
