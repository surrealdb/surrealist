import {
	Box,
	Button,
	Center,
	Divider,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { formatDistance } from "date-fns";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Icon } from "~/components/Icon";
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
	const canUpgrade = useHasOrganizationRole(instance?.organization_id ?? "", "admin");
	const unavailable = instance?.type.category === "free";

	return (
		<Skeleton visible={isLoading}>
			<Paper
				gap={0}
				component={Stack}
				pos="relative"
				mih={202}
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
					flex={1}
				>
					{unavailable ? (
						<>
							<Text flex={1}>
								Automated backups are not available for free instances. Upgrade this
								instance to enable automatic backups.
							</Text>
							{canUpgrade && (
								<Button
									size="xs"
									rightSection={<Icon path={iconChevronRight} />}
									variant="gradient"
									onClick={onUpgrade}
								>
									Upgrade instance
								</Button>
							)}
						</>
					) : latest ? (
						<>
							<Box flex={1}>
								<Text>Latest backup</Text>
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
									disabled
								>
									View available backups
								</Button>
							</Tooltip>
						</>
					) : (
						<Center flex={1}>
							<Text c="slate">Waiting for next backup...</Text>
						</Center>
					)}
				</Stack>
			</Paper>
		</Skeleton>
	);
}
