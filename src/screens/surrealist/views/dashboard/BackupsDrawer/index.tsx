import {
	Box,
	Button,
	Divider,
	Drawer,
	Group,
	ScrollArea,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import dayjs from "dayjs";
import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { CloudBackup, CloudInstance } from "~/types";
import { iconClose, iconHistory } from "~/util/icons";
import { InstanceBackup } from "./InstanceBackup";
import classes from "./style.module.scss";

export interface BackupsDrawerProps {
	opened: boolean;
	backups: CloudBackup[] | undefined;
	instance: CloudInstance;
	onClose: () => void;
}

export function BackupsDrawer({ opened, instance, backups, onClose }: BackupsDrawerProps) {
	const [width, setWidth] = useState(650);
	const [selected, setSelected] = useState<string | undefined>(undefined);

	const handleClose = useStable(() => {
		setSelected(undefined);
		onClose();
	});

	const handleRestore = useStable(() => {
		if (selected) {
			const params = new URLSearchParams();

			params.set("backupId", selected);
			params.set("instanceId", instance.id);
			const path = `/o/${instance.organization_id}/deploy?${params.toString()}`;

			navigate(path);
			onClose();
		}
	});

	return (
		<Drawer
			opened={opened}
			onClose={handleClose}
			position="right"
			trapFocus={false}
			size={width}
			padding={0}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
			/>

			<Group
				gap="sm"
				p="xl"
			>
				<PrimaryTitle>
					<Icon
						left
						path={iconHistory}
						size="sm"
					/>
					Instance backups
				</PrimaryTitle>

				<Spacer />

				<ActionButton
					label="Close drawer"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionButton>
			</Group>

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
									Create from backup
								</Text>

								<Text
									mt="sm"
									fz="lg"
								>
									Create a new instance based on a backup from this instance.
								</Text>
							</Box>

							{(!backups?.length || backups.length === 0) && (
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
										No backups available
									</Text>
									<Text>There are no backups available for this instance.</Text>
								</Stack>
							)}
							{backups?.length && backups.length > 0 && (
								<Stack>
									{backups
										?.sort((a, b) => {
											const dateA = dayjs(a.snapshot_started_at);
											const dateB = dayjs(b.snapshot_started_at);

											return dateB.valueOf() - dateA.valueOf();
										})
										?.map((backup) => (
											<InstanceBackup
												key={backup.snapshot_id}
												selected={selected === backup.snapshot_id}
												backup={backup}
												onSelect={() => setSelected(backup.snapshot_id)}
											/>
										))}
								</Stack>
							)}
						</Stack>
					</ScrollArea>
				</Box>

				<Group p="xl">
					<Button
						onClick={handleClose}
						color="slate"
						variant="light"
						flex={1}
					>
						Close
					</Button>
					<Tooltip label="Restoring is currently unavailable">
						<Button
							flex={1}
							type="submit"
							variant="gradient"
							// disabled={!selected}
							disabled
							onClick={handleRestore}
						>
							Create from selected
						</Button>
					</Tooltip>
				</Group>
			</Stack>
		</Drawer>
	);
}
