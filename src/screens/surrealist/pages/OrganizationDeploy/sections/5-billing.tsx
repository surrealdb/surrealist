import { Box, Radio, Slider, Stack, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { formatMemory } from "~/util/helpers";
import { DeploySectionProps, StorageCategory } from "../types";
import { useStable } from "~/hooks/stable";
import { Label } from "~/components/Label";
import { list } from "radash";
import { isDistributedType } from "~/cloud/helpers";

export function InformationSection({ details, setDetails }: DeploySectionProps) {
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

	const isStandard = details.storageCategory === "standard";
	const minimum = 100;
	const maximum = isStandard ? 1000 : 6000;
	const segments = isStandard ? list(100, 1000, (i) => i, 100) : list(0, 6000, (i) => i, 1000);

	const marks = segments.map((value) => ({
		value,
		label: formatMemory(Math.max(value, 100) * 1000, true),
	}));

	const isDistributed = details.type && isDistributedType(details.type);

	if (!isDistributed) {
		return null;
	}

	return (
		<Box>
			<PrimaryTitle fz={22}>Cluster configuration</PrimaryTitle>

			<Text fz="lg">Select a suitable storage class and size for your cluster</Text>

			<Box>
				{/* <Text fz="lg">Pick a suitable storage class for your intended workload</Text> */}

				<Radio.Group
					mt="xl"
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
										For larger workloads. Allows you to scale up to 6 TB of
										data, best suited for up to ten SurrealDB Compute nodes.
									</Text>
								</Box>
							}
						/>
					</Stack>
				</Radio.Group>

				<Slider
					mt={28}
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
			</Box>
		</Box>
	);
}
