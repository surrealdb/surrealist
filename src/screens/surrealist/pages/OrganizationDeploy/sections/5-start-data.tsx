import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useSearchParams } from "~/hooks/routing";
import { STARTING_DATA } from "../constants";
import { DeploySectionProps, StartingData } from "../types";

export function StartingDataSection({ details, setDetails }: DeploySectionProps) {
	const { instanceId } = useSearchParams();

	return (
		<Stack gap="xl">
			<PrimaryTitle>Instance data</PrimaryTitle>
			<SimpleGrid
				cols={2}
				spacing="lg"
			>
				{STARTING_DATA.map((data) => {
					const disabled = instanceId !== undefined && data.id !== "restore";

					return (
						<StartingDataCard
							key={data.title}
							data={data}
							selected={details.startingData.type === data.id}
							disabled={disabled}
							onSelect={() => {
								setDetails((draft) => {
									// Automatically select a dataset to use so its not empty
									const dataset =
										data.id === "dataset"
											? "surreal-deal-store-mini"
											: undefined;

									draft.startingData = {
										type: data.id,
										datasetOptions: {
											id: dataset,
											addQueries:
												details.startingData.datasetOptions?.addQueries,
										},
									};
								});
							}}
						/>
					);
				})}
			</SimpleGrid>
		</Stack>
	);
}

interface StartingDataCardProps {
	data: StartingData;
	selected?: boolean;
	disabled?: boolean;
	onSelect?: () => void;
}

function StartingDataCard({ data, selected, disabled, onSelect }: StartingDataCardProps) {
	return (
		<Paper
			p="lg"
			variant={disabled ? "disabled" : selected ? "selected" : "interactive"}
			onClick={disabled ? undefined : onSelect}
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
