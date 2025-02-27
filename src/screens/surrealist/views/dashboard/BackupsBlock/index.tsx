import { Paper, Group, Text, Box, Stack, Divider, Button, Tooltip, Skeleton } from "@mantine/core";
import { formatDistance } from "date-fns";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { CloudBackup, CloudInstance } from "~/types";
import { iconChevronRight, iconHistory } from "~/util/icons";

export interface BackupsBlockProps {
	instance: CloudInstance | undefined;
	backups: CloudBackup[] | undefined;
	isLoading: boolean;
	onUpgrade: () => void;
}

export function BackupsBlock({ instance, backups, isLoading, onUpgrade }: BackupsBlockProps) {
	const latest = backups?.[0];
	const unavailable = instance?.type.category === "free";

	return (
		<Skeleton visible={isLoading}>
			<Paper
				gap={0}
				component={Stack}
				pos="relative"
			>
				<Group p="xl">
					<Icon
						path={iconHistory}
						size="lg"
					/>
					<Text
						c="bright"
						fw={700}
						fz="xl"
					>
						Backups
					</Text>
				</Group>

				<Divider />

				<Stack
					p="xl"
					gap="xl"
				>
					{unavailable ? (
						<>
							<Text>
								Automated backups are not available for free instances. Please
								upgrade your instance type to enable automated backups and support
								for backup restoration.
							</Text>
							<Button
								size="xs"
								rightSection={<Icon path={iconChevronRight} />}
								variant="gradient"
								onClick={onUpgrade}
							>
								Upgrade instance
							</Button>
						</>
					) : (
						latest && (
							<>
								<Box>
									<Label>Latest backup</Label>
									<Text
										c="bright"
										fz="xl"
										fw={600}
									>
										{formatDistance(latest.snapshot_started_at, new Date(), {
											addSuffix: true,
										})}
									</Text>
								</Box>

								<Tooltip label="This functionality will be available soon">
									<Button
										size="xs"
										rightSection={<Icon path={iconChevronRight} />}
										variant="gradient"
									>
										View available backups
									</Button>
								</Tooltip>
							</>
						)
					)}
				</Stack>
			</Paper>
		</Skeleton>
	);
}
