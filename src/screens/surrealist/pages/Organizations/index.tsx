import classes from "./style.module.scss";

import { Box, ScrollArea, Stack, Text } from "@mantine/core";

import { CloudSplash } from "~/components/CloudSplash";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated } from "~/hooks/cloud";

export function OrganizationsPage() {
	const isAuthed = useIsAuthenticated();

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			{isAuthed ? (
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					viewportProps={{
						style: { paddingBottom: 75 },
					}}
				>
					<Stack
						gap={42}
						mx="auto"
						maw={1100}
						mt={75}
					>
						<Box>
							<PrimaryTitle fz={26}>Organizations</PrimaryTitle>
							<Text fz="xl">View and manage your organizations</Text>
						</Box>
					</Stack>
				</ScrollArea>
			) : (
				<CloudSplash />
			)}
		</Box>
	);
}
