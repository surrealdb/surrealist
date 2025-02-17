import { Paper, Group, Divider, Text, Box, Stack, Button } from "@mantine/core";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Spacer } from "~/components/Spacer";
import { iconChevronRight, iconDotsVertical, iconHistory } from "~/util/icons";

export function BackupsBlock() {
	return (
		<Paper
			p="xl"
			component={Stack}
			gap={0}
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
			{/* <Divider my="md" /> */}
			<Paper
				mt="md"
				// bg="slate.7"
				// withBorder={false}
				p="md"
			>
				<Group>
					<Box flex="1">
						<Label>Last backup</Label>
						<Text
							c="bright"
							span
							fw={600}
							fz="xl"
						>
							4 hours ago
						</Text>
					</Box>
					<ActionButton label="Options">
						<Icon path={iconDotsVertical} />
					</ActionButton>
				</Group>
			</Paper>
			<Spacer />
			<Button
				fullWidth
				color="slate"
				variant="light"
				rightSection={<Icon path={iconChevronRight} />}
			>
				View backup history
			</Button>
		</Paper>
	);
}
