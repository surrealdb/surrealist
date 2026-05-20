import { Box, Button, Divider, Drawer, Group, ScrollArea, Stack, Tabs, Text } from "@mantine/core";
import { Icon, iconClose, iconHistory } from "@surrealdb/ui";
import dayjs from "dayjs";
import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { CloudBackup, CloudInstance } from "~/types";
import { BackupRetention } from "./BackupRetention";
import { InstanceBackup } from "./InstanceBackup";
import classes from "./style.module.scss";

export interface BackupsDrawerProps {
	opened: boolean;
	tab: string;
	backups: CloudBackup[] | undefined;
	instance: CloudInstance;
	onChangeTab: (tab: string) => void;
	onClose: () => void;
}

export function BackupsDrawer({
	opened,
	tab,
	instance,
	backups,
	onChangeTab,
	onClose,
}: BackupsDrawerProps) {
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
			const path = `/o/${instance.organization_id}/instances/deploy?${params.toString()}`;

			navigate(path);
			onClose();
		}
	});

	return (
		<Drawer
			withCloseButton={false}
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
				<Group>
					<Icon path={iconHistory} />
					<Text
						fw={700}
						fz="xl"
						c="bright"
					>
						Instance backups
					</Text>
				</Group>

				<Spacer />

				<ActionButton
					label="Close drawer"
					onClick={handleClose}
				>
					<Icon path={iconClose} />
				</ActionButton>
			</Group>

			<Tabs
				variant="gradient"
				value={tab}
				className={classes.drawerTabs}
				onChange={onChangeTab as any}
				flex={1}
			>
				<Box px="md">
					<Tabs.List
						mb="xl"
						grow
					>
						<Tabs.Tab
							value="backups"
							py="sm"
						>
							Available backups
						</Tabs.Tab>
						<Tabs.Tab
							value="retention"
							py="sm"
						>
							Retention settings
						</Tabs.Tab>
					</Tabs.List>
				</Box>

				<Tabs.Panel value="backups">
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
											Create a new instance based on a backup from this
											instance.
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
											<Text>
												There are no backups available for this instance.
											</Text>
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
														onSelect={() =>
															setSelected(backup.snapshot_id)
														}
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
								onClick={handleRestore}
							>
								Create from selected
							</Button>
						</Group>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value="retention">
					<Divider />
					<BackupRetention
						instance={instance}
						onClose={handleClose}
					/>
				</Tabs.Panel>
			</Tabs>
		</Drawer>
	);
}
