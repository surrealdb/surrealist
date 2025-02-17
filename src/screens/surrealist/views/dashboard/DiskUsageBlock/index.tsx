import { Paper, Group, Divider, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { iconDatabase } from "~/util/icons";

export function DiskUsageBlock() {
	return (
		<Paper
			p="xl"
			h={250}
		>
			<Group>
				<Icon
					path={iconDatabase}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Disk Usage
				</Text>
			</Group>
			<Divider my="md" />
			TODO
		</Paper>
	);
}
