import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { iconChevronRight } from "~/util/icons";
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
			size="sm"
		>
			<Stack>
				<Text c="bright">
					The Sandbox provides an easy to use playground to test, experiment, and learn SurrealDB. You can use the sandbox without having
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
			>
				Get started
			</Button>
		</Modal>
	);
}
