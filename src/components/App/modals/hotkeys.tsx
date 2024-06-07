import { Modal, Stack } from "@mantine/core";
import { useIntent } from "~/hooks/url";
import { useBoolean } from "~/hooks/boolean";
import { ModalTitle } from "~/components/ModalTitle";

export function KeymapModal() {
	const [isOpen, openedHandle] = useBoolean();

	useIntent("open-keymap", openedHandle.open);

	return (
		<>
			<Modal
				opened={isOpen}
				onClose={openedHandle.close}
				trapFocus={false}
				withCloseButton
				size="xl"
				title={
					<ModalTitle>Keyboard Shortcuts</ModalTitle>
				}
			>
				<Stack>
					
				</Stack>
			</Modal>
		</>
	);
}
