import { Box, Collapse, Radio, Slider, Stack, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { formatMemory } from "~/util/helpers";
import { DeploySectionProps, StorageCategory } from "../types";
import { useStable } from "~/hooks/stable";
import { Label } from "~/components/Label";
import { list } from "radash";
import { isDistributedType } from "~/cloud/helpers";

export function ClusterStorageSection({ details, setDetails }: DeploySectionProps) {
	const updateCategory = useStable((value: string) => {
		setDetails((draft) => {
			draft.storageCategory = value as StorageCategory;

			if (draft.storageCategory === "standard") {
				draft.storageAmount = Math.min(draft.storageAmount, 1000);
			}
		});
	});

	const updateAmount = useStable((value: number) => {
		setDetails((draft) => {
			draft.storageAmount = value;
		});
	});

	const updateUnits = useStable((value: number) => {
		setDetails((draft) => {
			draft.units = value;
		});
	});

	const isStandard = details.storageCategory === "standard";
	const isDistributed = !!details.type && isDistributedType(details.type);

	const storageMinimum = 100;
	const storageMaximum = isStandard ? 1000 : 6000;
	const storageSegments = isStandard
		? list(100, 1000, (i) => i, 100)
		: list(0, 6000, (i) => i, 1000);

	const storageMarks = storageSegments.map((value) => ({
		value,
		label: formatMemory(Math.max(value, 100) * 1000, true),
	}));

	const computeMinimum = details.type?.compute_units.min ?? 1;
	const computeMaximum = details.type?.compute_units.max ?? 1;
	const computeSegments = list(computeMinimum, computeMaximum);

	const computeMarks = computeSegments.map((value) => ({
		value,
		label: `${value} nodes`,
	}));

	return (
		<Collapse in={isDistributed}>
			<Box mt={36}>
				<PrimaryTitle>Storage class</PrimaryTitle>
				{/* <Text>Select the storage class for your cluster.</Text> */}
			</Box>

			<Radio.Group
				mt="md"
				value={details.storageCategory}
				onChange={updateCategory}
			>
				<Stack>
					<Radio
						value="standard"
						label={
							<Box>
								<Label>Standard</Label>
								<Text>
									For small workloads. Allows you to scale up to 1 TB of data,
									best suited for up to two SurrealDB Compute nodes.
								</Text>
							</Box>
						}
					/>
					<Radio
						value="advanced"
						label={
							<Box>
								<Label>Advanced</Label>
								<Text>
									For larger workloads. Allows you to scale up to 6 TB of data,
									best suited for up to ten SurrealDB Compute nodes.
								</Text>
							</Box>
						}
					/>
				</Stack>
			</Radio.Group>

			<Box mt={36}>
				<PrimaryTitle>Storage capacity</PrimaryTitle>
				<Text>Choose the appropriate disk size for your instance</Text>
			</Box>

			<Slider
				mt="xl"
				h={40}
				min={storageMinimum}
				max={storageMaximum}
				step={100}
				value={details.storageAmount}
				onChange={updateAmount}
				marks={storageMarks}
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

			<Box mt={36}>
				<PrimaryTitle>Compute nodes</PrimaryTitle>
				<Text>Select the number of compute nodes for your cluster.</Text>
			</Box>

			<Slider
				mt="xl"
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
		</Collapse>
	);
}
