import { Box, Slider, Text, Tooltip } from "@mantine/core";
import { list } from "radash";
import { useMemo } from "react";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { formatMemory } from "~/util/helpers";
import { DeploySectionProps } from "../types";

export function StorageOptionsSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);
	const isDedicated = details.plan === "enterprise";

	const instanceType = instanceTypes.get(details.computeType);
	const storageMin = isDedicated ? 100 : (instanceType?.default_storage_size ?? 0);
	const storageMax = isDedicated ? 6000 : (instanceType?.max_storage_size ?? 0);

	const marks = useMemo(() => {
		if (storageMin === 0 && storageMax === 0) {
			return [];
		}

		return list(
			storageMin,
			storageMax,
			(value) => ({
				value,
				label: formatMemory(value * 1000, true),
			}),
			(storageMax - storageMin) / 4,
		);
	}, [storageMin, storageMax]);

	const updateAmount = useStable((value: number) => {
		setDetails((draft) => {
			draft.storageAmount = value;
		});
	});

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
					disabled={!details.computeType}
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
