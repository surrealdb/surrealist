import { Box, Group, Stack, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { ProvisionStepProps } from "../types";
import { useAvailableRegions } from "~/hooks/cloud";
import { Tile } from "~/screens/cloud-panel/components/Tile";
import { Image } from "@mantine/core";
import { REGION_FLAGS } from "~/constants";
import { StepActions } from "../actions";

export function ProvisionRegionsStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const regions = useAvailableRegions();

	return (
		<Stack>
			<PrimaryTitle>Select a region</PrimaryTitle>

			<Text mb="lg">
				Regions define the physical location of your instance. Choosing a region close to
				your users can improve performance.
			</Text>

			<Stack>
				{regions.map((type) => (
					<Tile
						key={type.slug}
						isActive={type.slug === details.region}
						onClick={() =>
							setDetails((draft) => {
								draft.region = type.slug;
							})
						}
					>
						<Group
							gap="xl"
							pl="xs"
						>
							<Image
								src={REGION_FLAGS[type.slug]}
								w={24}
							/>
							<Box>
								<Text
									c="bright"
									fw={500}
									fz="lg"
								>
									{type.description}
								</Text>
							</Box>
						</Group>
					</Tile>
				))}

				<StepActions
					step={step}
					onPrevious={onPrevious}
					onContinue={onContinue}
					disabled={!details.region}
				/>
			</Stack>
		</Stack>
	);
}
