import classes from "../style.module.scss";

import { Stack, Box, Divider, ScrollArea, Group, Button, Text } from "@mantine/core";
import { CloudInstance } from "~/types";

export interface ConfigurationInstanceTypeProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationInstanceType({ instance, onClose }: ConfigurationInstanceTypeProps) {
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
								Select instance type
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Change the active instance type to adjust the resources available to
								your instance, including memory and CPU.
							</Text>
						</Box>
						TODO
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
