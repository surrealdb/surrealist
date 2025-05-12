import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps, StorageCategory } from "../types";
import { Box, Radio, Stack, Text } from "@mantine/core";
import { Label } from "~/components/Label";

export function StorageCategoryStep({ details, setDetails }: ProvisionStepProps) {
	const updateCategory = useStable((value: string) => {
		setDetails((draft) => {
			draft.storage_category = value as StorageCategory;
		});
	});

	return (
		<Radio.Group
			value={details.storage_category}
			onChange={updateCategory}
		>
			<Stack>
				<Radio
					value="standard"
					label={
						<Box>
							<Label>Standard</Label>
							<Text>
								For small workloads and development environments. Allows you to
								scale up to 1 TB of data, best suited for up to two SurrealDB
								Compute nodes.
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
								For larger workloads. Allows you to scale up to 6 TB of data, best
								suited for up to ten SurrealDB Compute nodes.
							</Text>
						</Box>
					}
				/>
			</Stack>
		</Radio.Group>
	);
}
