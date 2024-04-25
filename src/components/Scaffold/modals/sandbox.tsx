import banner from "~/assets/images/sandbox.png";
import { ActionIcon, Box, Button, Image, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { iconChevronRight, iconClose } from "~/util/icons";
import { useEffect } from "react";
import { useConnection } from "~/hooks/connection";
import { SANDBOX } from "~/constants";
import { useOnboarding } from "~/hooks/onboarding";

export function SandboxModal() {
	const [isOpen, openHandle] = useDisclosure();
	const [completed, complete] = useOnboarding('sandbox');
	const connection = useConnection();

	useEffect(() => {
		if (connection?.id === SANDBOX && !completed) {
			openHandle.open();
			complete();
		}
	}, [connection]);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			trapFocus={false}
			padding={0}
			size={475}
		>
			<ActionIcon
				pos="absolute"
				top={16}
				right={16}
				onClick={openHandle.close}
				aria-label="Close modal"
			>
				<Icon path={iconClose} />
			</ActionIcon>

			<Image src={banner} />

			<Box p={24}>
				<Stack>
					<Text c="bright">
						The Sandbox provides an easy to use playground to test, experiment, and learn SurrealDB.
					</Text>
					<Text>
						You can use the sandbox without having
						to start a database up, and data will be reset after you close Surrealist. Additionally, you can use the buttons in the toolbar
						to manually reset the sandbox or load an official dataset.
					</Text>
				</Stack>

				<Button
					mt="xl"
					size="xs"
					fullWidth
					variant="gradient"
					onClick={openHandle.close}
					rightSection={<Icon path={iconChevronRight} />}
					radius="sm"
				>
					Get started
				</Button>
			</Box>
		</Modal>
	);
}
