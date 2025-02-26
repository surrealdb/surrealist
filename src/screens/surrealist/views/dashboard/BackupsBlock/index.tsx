import { Paper, Group, Text, Box, Stack, ThemeIcon, Divider, Alert, Button } from "@mantine/core";
import { format, formatDistance } from "date-fns";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { CloudInstance } from "~/types";
import { DATE_TIME_FORMAT } from "~/util/helpers";
import {
	iconCheck,
	iconChevronRight,
	iconDotsVertical,
	iconDownload,
	iconHistory,
} from "~/util/icons";

export interface BackupsBlockProps {
	instance: CloudInstance | undefined;
}

export function BackupsBlock({ instance }: BackupsBlockProps) {
	const isLight = useIsLight();
	const { data } = useCloudBackupsQuery(instance?.id);

	const backups = data ?? [];
	const latest = backups[0];
	const unavailable = instance?.type.category === "free" && false;

	return (
		<Box>
			<Paper
				p="xl"
				gap={0}
				component={Stack}
				pos="relative"
			>
				<Stack gap="xl">
					<Group>
						<ThemeIcon
							color="slate"
							radius="xs"
							size="xl"
						>
							<Icon
								path={iconHistory}
								size="xl"
								c="slate"
							/>
						</ThemeIcon>
						<Box>
							<PrimaryTitle mt={-4}>Backups</PrimaryTitle>
							<Text>Automated instance backups</Text>
						</Box>
					</Group>
					<Divider />

					{unavailable ? (
						<Alert
							title="Backups not available"
							color="orange"
						>
							<Text>
								Automated backups are not available for free instances. Please
								upgrade your instance type to enable backups.
							</Text>
							<Button
								size="xs"
								mt="md"
								color={isLight ? "slate.9" : "slate.0"}
								variant="light"
								onClick={() => {}}
							>
								Upgrade instance
							</Button>
						</Alert>
					) : (
						latest && (
							<>
								<Box>
									<Label>Latest backup</Label>
									<PrimaryTitle>
										{formatDistance(latest.snapshot_started_at, new Date(), {
											addSuffix: true,
										})}
									</PrimaryTitle>
								</Box>

								<Button
									color="slate"
									variant="light"
									rightSection={<Icon path={iconChevronRight} />}
								>
									View all backups
								</Button>
							</>
						)
					)}
				</Stack>
			</Paper>
		</Box>
	);
}
