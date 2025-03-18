import classes from "./style.module.scss";

import { Alert, Box, Button, ScrollArea, Stack, Text } from "@mantine/core";
import { Link } from "wouter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { iconArrowLeft } from "~/util/icons";

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
						<PrimaryTitle fz={26}>New organization</PrimaryTitle>
						<Text fz="xl">Create a space to manage your team</Text>
					</Box>

					<Link to="/overview">
						<Button
							variant="light"
							color="slate"
							size="xs"
							leftSection={<Icon path={iconArrowLeft} />}
						>
							Back to overview
						</Button>
					</Link>

					<Alert title="Coming soon">This functionality is not yet available</Alert>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
