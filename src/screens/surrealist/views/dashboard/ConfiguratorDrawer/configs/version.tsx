import { Box, Button, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { Icon, iconOpen } from "@surrealdb/ui";
import { useState } from "react";
import { Tile } from "~/components/Tile";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { openSurrealChangelog } from "~/util/cloud";
import classes from "../style.module.scss";

export interface ConfigurationVersionProps {
	instance: CloudInstance;
	onUpdate: (version: string) => void;
	onClose: () => void;
}

export function ConfigurationVersion({ instance, onUpdate, onClose }: ConfigurationVersionProps) {
	const [selected, setSelected] = useState("");

	const handleUpdate = useStable(() => {
		onUpdate(selected);
		onClose();
	});

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
							instance.available_versions.map((version) => (
								<Tile
									key={version}
									p="lg"
									withBorder={false}
									isActive={selected === version}
									onClick={() => setSelected(version)}
								>
									<Group>
										<Text
											c="bright"
											fw={500}
											fz="xl"
											flex={1}
										>
											SurrealDB {version}
										</Text>
										<Button
											size="xs"
											color="obsidian"
											variant="light"
											rightSection={<Icon path={iconOpen} />}
											onClick={(e) => {
												openSurrealChangelog(version);
												e.stopPropagation();
											}}
										>
											View changelog
										</Button>
									</Group>
								</Tile>
							))
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
					color="obsidian"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					flex={1}
					type="submit"
					variant="gradient"
					disabled={!selected}
					onClick={handleUpdate}
				>
					Update instance
				</Button>
			</Group>
		</Stack>
	);
}
