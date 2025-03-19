import { Box, Center, ScrollArea, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { HelpCenter } from "~/components/HelpCenter";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import classes from "./style.module.scss";

export function SupportPage() {
	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

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
					maw={1100}
					h="100%"
				>
					<Box>
						<PrimaryTitle fz={26}>Help & Support</PrimaryTitle>
						<Text fz="xl">Explore the resources below to get help with SurrealDB.</Text>
					</Box>
					<Center
						flex={1}
						pb={75}
						pt="xl"
					>
						<HelpCenter />
					</Center>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
