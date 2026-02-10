import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import dayjs from "dayjs";
import { CloudBackup } from "~/types";
import { iconFile } from "~/util/icons";

export interface InstanceBackupProps {
	selected: boolean;
	backup: CloudBackup;
	onSelect: () => void;
}

export function InstanceBackup({ selected, backup, onSelect }: InstanceBackupProps) {
	return (
		<Paper
			p="md"
			variant={selected ? "selected" : "interactive"}
			onClick={() => onSelect()}
		>
			<Group gap="md">
				<ThemeIcon
					color="slate"
					variant="light"
					size="lg"
				>
					<Icon path={iconFile} />
				</ThemeIcon>
				<Stack gap={2}>
					<Text
						c="bright"
						fw={500}
						fz="lg"
					>
						{dayjs(backup.snapshot_started_at).format("MMMM D, YYYY - h:mm A")}
					</Text>

					<Text
						size="sm"
						c="dimmed"
					>
						Automatic backup
					</Text>
				</Stack>
			</Group>
		</Paper>
	);
}
