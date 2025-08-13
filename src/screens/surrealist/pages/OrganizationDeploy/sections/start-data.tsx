import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useSearchParams } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { STARTING_DATA } from "../constants";
import { DeploySectionProps, StartingDataInfo } from "../types";

export function StartingDataSection({ details, setDetails }: DeploySectionProps) {
	const { instanceId } = useSearchParams();

	const handleSelect = useStable((data: StartingDataInfo) => {
		setDetails((draft) => {
			// Automatically select a dataset to use so its not empty
			const dataset = data.id === "dataset" ? "surreal-deal-store-mini" : undefined;

			draft.startingData = {
				type: data.id,
				datasetOptions: {
					id: dataset,
					addQueries: details.startingData.datasetOptions?.addQueries,
				},
			};
		});
	});

	const current = details.startingData.type;

	return (
		<Stack gap="xl">
			<PrimaryTitle>Instance data</PrimaryTitle>
			<SimpleGrid
				cols={2}
				spacing="lg"
			>
				<StartingDataCard
					data={STARTING_DATA.none}
					selected={current === "none"}
					disabled={instanceId !== undefined}
					onSelect={handleSelect}
				/>
				<StartingDataCard
					data={STARTING_DATA.dataset}
					selected={current === "dataset"}
					disabled={instanceId !== undefined}
					onSelect={handleSelect}
				/>
				<StartingDataCard
					data={STARTING_DATA.upload}
					selected={current === "upload"}
					disabled={instanceId !== undefined}
					onSelect={handleSelect}
				/>
				<StartingDataCard
					data={STARTING_DATA.restore}
					selected={current === "restore"}
					onSelect={handleSelect}
				/>
			</SimpleGrid>
		</Stack>
	);
}

interface StartingDataCardProps {
	data: StartingDataInfo;
	selected?: boolean;
	disabled?: boolean;
	onSelect: (data: StartingDataInfo) => void;
}

function StartingDataCard({ data, selected, disabled, onSelect }: StartingDataCardProps) {
	const handleSelect = useStable(() => {
		if (disabled) return;
		onSelect(data);
	});

	return (
		<Paper
			p="lg"
			variant={disabled ? "disabled" : selected ? "selected" : "interactive"}
			onClick={disabled ? undefined : handleSelect}
			style={{
				cursor: disabled ? "not-allowed" : "pointer",
			}}
			opacity={disabled ? 0.6 : 1}
		>
			<Stack gap="xs">
				<Group>
					<PrimaryTitle fz={18}>{data.title}</PrimaryTitle>
					<Spacer />
					<Icon
						path={data.icon}
						c="slate"
					/>
				</Group>
				<Text>{data.description}</Text>
			</Stack>
		</Paper>
	);
}
