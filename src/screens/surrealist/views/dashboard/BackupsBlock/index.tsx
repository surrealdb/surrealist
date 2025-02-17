import { Paper, Group, Divider, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { iconHistory } from "~/util/icons";

export function BackupsBlock() {
	return (
		<Paper
			p="xl"
			h={250}
		>
			<Group>
				<Icon
					path={iconHistory}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Backups
				</Text>
			</Group>
			<Divider my="md" />
			TODO
		</Paper>
	);
}
