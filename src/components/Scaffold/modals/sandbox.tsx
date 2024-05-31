import {
	ActionIcon,
	Box,
	Button,
	Image,
	Modal,
	Stack,
	Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import banner from "~/assets/images/sandbox.webp";
import { Icon } from "~/components/Icon";
import { SANDBOX } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { useOnboarding } from "~/hooks/onboarding";
import { iconChevronRight, iconClose } from "~/util/icons";

export function SandboxModal() {
	const [isOpen, openHandle] = useDisclosure();
	const [completed, complete] = useOnboarding("sandbox");
	const connection = useConnection();

	// biome-ignore lint/correctness/useExhaustiveDependencies: ignoring
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
						The Sandbox provides an easy to use playground to test, experiment,
						and learn SurrealDB.
					</Text>
					<Text>
						You can use the sandbox without having to start a database up, and
						data will be reset after you close Surrealist. Additionally, you can
						use the buttons in the toolbar to manually reset the sandbox or load
						an official dataset.
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
