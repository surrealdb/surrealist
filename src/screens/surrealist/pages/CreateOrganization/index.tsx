import classes from "./style.module.scss";

import { Box, ScrollArea, Stack, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";

export function CreateOrganizationPage() {
	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					mx="auto"
					maw={650}
					gap="xl"
				>
					<Box>
						<PrimaryTitle>New organization</PrimaryTitle>
						<Text fz="xl">Create a space to manage your team</Text>
					</Box>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
