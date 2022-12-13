import { Button, Divider, Group, Modal, Paper, Stack, Text, Title } from "@mantine/core";
import { mdiCog } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "../Icon";
import { Spacer } from "../Scaffold/Spacer";

export function Settings() {
	const [showSettings, setShowSettings] = useState(false);

	const version = import.meta.env.VERSION;
	const author = import.meta.env.AUTHOR;

	const openSettings = useStable(() => {
		setShowSettings(true);
	});

	const closeSettings = useStable(() => {
		setShowSettings(false);
	});

	return (
		<>
			<Button
				color="light.0"
				px="xs"
				onClick={openSettings}
			>
				<Icon
					path={mdiCog}
					color="light.8"
				/>
			</Button>

			<Modal
				opened={showSettings}
				onClose={closeSettings}
				size="lg"
				title={
					<Title size={16}>
						Settings
					</Title>
				}
			>
				<Stack>
					<Text color="light.4">
						Settings will be available in the near future!
					</Text>
					<Paper
						bg="light.0"
						p="sm"
					>
						<Text color="light.4">
							Version {version} by Starlane Studios
						</Text>
					</Paper>
					<Group>
						<Button color="light" onClick={closeSettings}>
							Back
						</Button>
						<Spacer />
						<Button type="submit" disabled>
							Save
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	)
}