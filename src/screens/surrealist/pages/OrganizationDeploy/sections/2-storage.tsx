import { Box, Radio, Slider, Stack, Text } from "@mantine/core";
import { list } from "radash";
import { useEffect, useState } from "react";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { StorageCategory } from "~/types";
import { formatMemory } from "~/util/helpers";
import { DeploySectionProps } from "../types";

export function StorageOptionsSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);
	const isStandard = details.storageCategory === "standard";
	const isEnterprise = details.plan === "enterprise";

	const [storageMax, setStorageMax] = useState<number>(1);
	const [storageMin, setStorageMin] = useState<number>(1);

	const updateCategory = useStable((value: string) => {
		setDetails((draft) => {
			draft.storageCategory = value as StorageCategory;

			if (draft.storageCategory === "standard") {
				draft.storageAmount = Math.min(draft.storageAmount, 4);
			}
		});
	});

	const marks = list(storageMin, storageMax, (i) => i, storageMax / 8).map((value) => ({
		value,
		label: formatMemory(value * 1000, true),
	}));

	const updateAmount = useStable((value: number) => {
		setDetails((draft) => {
			draft.storageAmount = value;
		});
	});

	useEffect(() => {
		const type = instanceTypes.get(details.type);

		if (type) {
			const enterpriseMax = isStandard ? 1000 : 6000;
			const storageMinimum = type?.default_storage_size ?? 4;
			const storageMaximum = isEnterprise ? enterpriseMax : type.max_storage_size;

			setStorageMin(storageMinimum);
			setStorageMax(storageMaximum);
		}
	}, [details.type, instanceTypes, isEnterprise, isStandard]);

	return (
		<>
			{isEnterprise && (
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
											Best suited for small workloads with lower compute
											requirements. Allows you to scale up to 1 TB of data.
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
				</>
			)}

			<Box>
				<PrimaryTitle>Storage capacity</PrimaryTitle>
				<Text>Choose the appropriate disk size for your instance</Text>
			</Box>
			<Slider
				mt="xs"
				h={40}
				min={storageMin}
				max={storageMax}
				disabled={!details.type}
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
		</>
	);
}
