import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconFile } from "@surrealdb/ui";
import dayjs from "dayjs";
import { CloudBackup } from "~/types";

export interface InstanceBackupProps {
	selected: boolean;
	backup: CloudBackup;
	onSelect: () => void;
}

export function InstanceBackup({ selected, backup, onSelect }: InstanceBackupProps) {
	return (
		<Paper
			p="md"
			bg="obsidian.8"
			withBorder
			style={{
				borderColor: selected ? "var(--mantine-color-violet-6)" : undefined,
			}}
			onClick={() => onSelect()}
		>
			<Group gap="md">
				<ThemeIcon
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
