import { Paper, Group, Divider, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { iconQuery } from "~/util/icons";

export function ComputeUsageBlock() {
	return (
		<Paper p="xl">
			<Group>
				<Icon
					path={iconQuery}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Compute Usage
				</Text>
			</Group>
			<Divider my="md" />
			TODO
		</Paper>
	);
}
