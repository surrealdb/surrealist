import { Box, Slider, Text, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { plural } from "~/util/helpers";
import { DeploySectionProps } from "../types";

export function ComputeNodesSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);

	const instanceType = instanceTypes.get(details.computeType);
	const nodeMin = instanceType?.compute_units.min ?? 0;
	const nodeMax = instanceType?.compute_units.max ?? 0;
	const marks = useMemo(() => {
		if (nodeMin >= nodeMax) {
			return [];
		}

		return Array.from({ length: nodeMax - nodeMin + 1 }, (_, index) => {
			const value = nodeMin + index;

			return {
				value,
				label: String(value),
			};
		});
	}, [nodeMin, nodeMax]);

	const updateComputeUnits = useStable((value: number) => {
		setDetails((draft) => {
			draft.computeUnits = value;
		});
	});

	return (
		<Box>
			<Box>
				<PrimaryTitle>Node count</PrimaryTitle>
				<Text>Configure the number of nodes in your cluster</Text>
			</Box>

			<Tooltip
				label="You can select compute nodes after selecting an instance type"
				disabled={!!details.computeType}
			>
				<Slider
					mt="xl"
					h={32}
					min={nodeMin}
					max={nodeMax}
					step={1}
					disabled={!details.computeType}
					value={details.computeUnits}
					onChange={updateComputeUnits}
					marks={marks}
					label={(value) => `${value} ${plural(value, "node")}`}
					color="violet"
					styles={{
						label: {
							paddingInline: 10,
							fontSize: "var(--mantine-font-size-md)",
							fontWeight: 600,
						},
					}}
				/>
			</Tooltip>
		</Box>
	);
}
