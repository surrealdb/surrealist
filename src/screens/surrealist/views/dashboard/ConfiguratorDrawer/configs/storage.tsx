import classes from "../style.module.scss";

import { Alert, Box, Button, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { CloudInstance } from "~/types";

export interface ConfigurationStorageProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationStorage({ instance, onClose }: ConfigurationStorageProps) {
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
								Increase disk size
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								You can increase your disk size to store more data within your
								database.
							</Text>
						</Box>
						<Alert
							color="blue"
							title="Coming soon"
						>
							Increasing disk size will be available in a future update
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
