import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconFile } from "@surrealdb/ui";
import dayjs from "dayjs";
import { useIsLight } from "~/hooks/theme";
import { CloudBackup } from "~/types";

export interface InstanceBackupProps {
	selected: boolean;
	backup: CloudBackup;
	onSelect: () => void;
}

export function InstanceBackup({ selected, backup, onSelect }: InstanceBackupProps) {
	const isLight = useIsLight();

	return (
		<Paper
			p="lg"
			bg={isLight ? "obsidian.1" : "obsidian.8"}
			withBorder
			radius="md"
			style={{
				borderColor: selected ? "var(--mantine-color-violet-6)" : undefined,
				cursor: "pointer",
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

					<Text size="sm">Automatic backup</Text>
				</Stack>
			</Group>
		</Paper>
	);
}
