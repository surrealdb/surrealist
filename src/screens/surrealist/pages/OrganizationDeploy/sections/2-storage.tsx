import { Box, Radio, Slider, Stack, Text } from "@mantine/core";
import { list } from "radash";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { StorageCategory } from "~/types";
import { formatMemory } from "~/util/helpers";
import { DeploySectionProps } from "../types";

export function StorageOptionsSection({ details, setDetails }: DeploySectionProps) {
	const isStandard = details.storageCategory === "standard";

	const storageMinimum = 100;
	const storageMaximum = isStandard ? 1000 : 6000;
	const storageSegments = isStandard
		? list(100, 1000, (i) => i, 100)
		: list(0, 6000, (i) => i, 1000);

	const storageMarks = storageSegments.map((value) => ({
		value,
		label: formatMemory(Math.max(value, 100) * 1000, true),
	}));

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

	return (
		<>
			<PrimaryTitle>Storage class</PrimaryTitle>
			<Radio.Group
				value={details.storageCategory}
				onChange={updateCategory}
			>
				<Stack gap="xl">
					<Radio
						value="standard"
						label={
							<Box>
								<Label>Standard</Label>
								<Text>
									Best suited for small workloads with lower compute requirements.
									Allows you to scale up to 1 TB of data.
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
									Best suited for larger workloads with higher compute
									requirements. Allows you to scale up to 6 TB of data.
								</Text>
							</Box>
						}
					/>
				</Stack>
			</Radio.Group>

			<Box>
				<PrimaryTitle>Storage capacity</PrimaryTitle>
				<Text>Choose the appropriate disk size for your instance</Text>
			</Box>
			<Slider
				mt="xs"
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
		</>
	);
}
