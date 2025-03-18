import classes from "./style.module.scss";

import { Box, ScrollArea, Stack, Text } from "@mantine/core";
import { ConnectionDetails } from "~/components/ConnectionDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useConfigStore } from "~/stores/config";
import { createBaseConnection } from "~/util/defaults";

export function CreateConnectionPage() {
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
						<PrimaryTitle>New connection</PrimaryTitle>
						<Text fz="xl">Connect to any SurrealDB instance</Text>
					</Box>

					<ConnectionDetails
						value={createBaseConnection(useConfigStore.getState().settings)}
						onChange={() => {}}
					/>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
