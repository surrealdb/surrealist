import { Paper, Group, Text, Box, Stack, Divider, Button, Tooltip } from "@mantine/core";
import { formatDistance } from "date-fns";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { CloudInstance } from "~/types";
import { iconChevronRight, iconHistory } from "~/util/icons";

export interface BackupsBlockProps {
	instance: CloudInstance | undefined;
}

export function BackupsBlock({ instance }: BackupsBlockProps) {
	const { data } = useCloudBackupsQuery(instance?.id);

	const backups = data ?? [];
	const latest = backups[0];
	const unavailable = instance?.type.category === "free";

	return (
		<Box>
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
								onClick={() => {}}
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
		</Box>
	);
}
