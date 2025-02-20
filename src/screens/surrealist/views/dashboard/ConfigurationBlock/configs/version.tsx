import classes from "../style.module.scss";

import { Stack, Box, Divider, ScrollArea, Group, Button, Text, Paper, Center } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { CloudInstance } from "~/types";
import { iconCheck } from "~/util/icons";

export interface ConfigurationVersionProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationVersion({ instance, onClose }: ConfigurationVersionProps) {
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
								Update version
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Update your instance to a newer version of SurrealDB to access the
								latest features and improvements. Select an available version from
								the list to update to.
							</Text>
						</Box>

						{instance.available_versions.length > 0 ? (
							<Text>Test</Text>
						) : (
							<Stack
								flex={1}
								align="center"
								justify="center"
								gap="xs"
							>
								<Text
									fz="xl"
									c="bright"
									fw={600}
								>
									No updates available
								</Text>
								<Text>This instance is on the latest version</Text>
							</Stack>
						)}
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
					Apply update
				</Button>
			</Group>
		</Stack>
	);
}
