import classes from "../style.module.scss";

import { Stack, Divider, Box, ScrollArea, Group, Button, Text, Alert } from "@mantine/core";
import { CloudInstance } from "~/types";

export interface ConfigurationComputeNodesProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationComputeNodes({ instance, onClose }: ConfigurationComputeNodesProps) {
	return (
		<Stack
			h="100%"
			gap={0}
		>
			<Divider />

			<Box
				pos="relative"
				flex={1}
			>
				<ScrollArea
					pos="absolute"
					inset={0}
					className={classes.scrollArea}
				>
					<Stack
						gap="sm"
						p="xl"
						mih="100%"
					>
						<Box mb="xl">
							<Text
								fz="xl"
								c="bright"
								fw={600}
							>
								Allocate compute nodes
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Customize the number of compute nodes allocated to your instance,
								which will be used to run your queries and process your data.
							</Text>
						</Box>
						<Alert
							color="blue"
							title="Coming soon"
						>
							Allocating compute node will be available in a future update
						</Alert>
					</Stack>
				</ScrollArea>
			</Box>

			<Group p="xl">
				<Button
					onClick={onClose}
					color="slate"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled
					flex={1}
				>
					Apply instance type
				</Button>
			</Group>
		</Stack>
	);
}
