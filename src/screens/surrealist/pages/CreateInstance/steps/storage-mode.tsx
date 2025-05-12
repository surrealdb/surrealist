import { Box, Radio, Stack, Text } from "@mantine/core";
import { Label } from "~/components/Label";
import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps, StorageMode } from "../types";

export function StorageModeStep({ details, setDetails }: ProvisionStepProps) {
	const updateMode = useStable((value: string) => {
		setDetails((draft) => {
			draft.storage_mode = value as StorageMode;
		});
	});

	const allowDistributed = details.type && details.type !== "free";

	return (
		<Radio.Group
			value={details.storage_mode}
			onChange={updateMode}
		>
			<Stack>
				<Radio
					value="standalone"
					label={
						<Box>
							<Label>Standalone</Label>
							<Text>Run your Surreal Cloud instance as a single storage node.</Text>
						</Box>
					}
				/>
				<Radio
					value="distributed"
					disabled={!allowDistributed}
					label={
						<Box>
							<Label>Distributed</Label>
							<Text>
								Managed dedicated environment with fault-tolerance for highly
								scalable deployments.
							</Text>
						</Box>
					}
				/>
			</Stack>
		</Radio.Group>
	);
}
