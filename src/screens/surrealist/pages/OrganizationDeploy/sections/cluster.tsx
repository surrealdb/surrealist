import { Box, Slider, Text, Tooltip } from "@mantine/core";
import { list } from "radash";
import { useMemo } from "react";
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
	const computeMin = instanceType?.compute_units.min ?? 0;
	const computeMax = instanceType?.compute_units.max ?? 0;

	const marks = useMemo(() => {
		if (computeMin === 0 && computeMax === 0) {
			return [];
		}

		return list(computeMin, computeMax, (value) => ({
			value,
			label: `${value} nodes`,
		}));
	}, [computeMin, computeMax]);

	const isZero = computeMin === 0 && computeMax === 0;

	return (
		<Box>
			<Box>
				<PrimaryTitle>Compute nodes</PrimaryTitle>
				<Text>Select the number of compute nodes for your cluster.</Text>
			</Box>

			<Tooltip
				label="You can select compute nodes after selecting an instance type"
				disabled={!isZero}
			>
				<Slider
					mt="xl"
					h={32}
					min={computeMin}
					max={computeMax}
					step={1}
					disabled={isZero}
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
			</Tooltip>
		</Box>
	);
}
