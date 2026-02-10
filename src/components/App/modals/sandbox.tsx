import { Button, Divider, Image, Modal, Paper, Text } from "@mantine/core";
import { Icon, iconChevronRight, iconClose } from "@surrealdb/ui";
import { useEffect } from "react";
import banner from "~/assets/images/sandbox.webp";
import { ActionButton } from "~/components/ActionButton";
import { SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useOnboarding } from "~/hooks/onboarding";
import { useConnectionAndView } from "~/hooks/routing";

export function SandboxModal() {
	const [isOpen, openHandle] = useBoolean();
	const [completed, complete] = useOnboarding("sandbox");
	const [connection] = useConnectionAndView();

	useEffect(() => {
		if (connection === SANDBOX && !completed) {
			openHandle.open();
			complete();
		}
	}, [connection, completed]);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			trapFocus={false}
			padding={0}
			size={475}
		>
			<ActionButton
				pos="absolute"
				top={16}
				right={16}
				label="Close"
				onClick={openHandle.close}
			>
				<Icon path={iconClose} />
			</ActionButton>

			<Image src={banner} />

			<Divider />

			<Paper
				p={24}
				variant="gradient"
				withBorder={false}
				radius={0}
			>
				<Text
					c="bright"
					fw={500}
					fz="xl"
				>
					The Surrealist Sandbox provides an easy to use playground to test, experiment,
					and learn SurrealQL.
				</Text>

				<Text mt="xl">
					The sandbox lets you experiment without setting up a database—your data will be
					cleared when you close Surrealist. You can also use the toolbar buttons to
					manually reset the sandbox or load an official dataset.
				</Text>

				<Button
					mt="xl"
					size="xs"
					fullWidth
					variant="gradient"
					onClick={openHandle.close}
					rightSection={<Icon path={iconChevronRight} />}
					radius="sm"
				>
					Continue
				</Button>
			</Paper>
		</Modal>
	);
}
