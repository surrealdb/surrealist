import { Box, Slider, Text, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { formatMemory } from "~/util/helpers";
import { DeploySectionProps } from "../types";

export function StorageOptionsSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);

	const instanceType = instanceTypes.get(details.computeType);
	const storageMin = instanceType?.default_storage_size ?? 0;
	const storageMax = instanceType?.max_storage_size ?? 0;
	const hasRange = storageMax > storageMin;
	const marks = useMemo(() => {
		if (storageMin >= storageMax) {
			return [];
		}

		const range = storageMax - storageMin;
		const step =
			storageMax >= 2000 ? 1000 : range > 400 ? 100 : range > 80 ? 50 : range > 40 ? 10 : 1;
		const values = [storageMin];

		for (let value = Math.ceil(storageMin / step) * step; value < storageMax; value += step) {
			if (value > storageMin) {
				values.push(value);
			}
		}

		if (values[values.length - 1] !== storageMax) {
			values.push(storageMax);
		}

		return values.map((value) => ({
			value,
			label: `${value} GB`,
		}));
	}, [storageMin, storageMax]);

	const updateAmount = useStable((value: number) => {
		setDetails((draft) => {
			draft.storageAmount = value;
		});
	});

	// Wide ranges, such as clusters, move in 10 GB steps. Smaller single-node
	// ranges keep 1 GB steps.
	const sliderStep = storageMax - storageMin > 1000 ? 10 : 1;

	return (
		<Box>
			<Box>
				<PrimaryTitle>Storage capacity</PrimaryTitle>
				<Text>Choose the appropriate disk size for your instance</Text>
			</Box>

			<Tooltip
				label="You can select storage size after selecting an instance type"
				disabled={!!details.computeType}
			>
				<Slider
					mt="xl"
					h={32}
					min={storageMin}
					max={storageMax}
					step={sliderStep}
					disabled={!details.computeType || !hasRange}
					value={details.storageAmount}
					onChange={updateAmount}
					marks={marks}
					label={(value) => formatMemory(value * 1000, true)}
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
