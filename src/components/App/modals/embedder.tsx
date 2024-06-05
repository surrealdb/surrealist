import { Modal } from "@mantine/core";
import { Embedder } from "~/components/Embedder";
import { ModalTitle } from "~/components/ModalTitle";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/url";

export function EmbedderModal() {
	const [isOpen, openHandle] = useBoolean();

	useIntent("open-embedder", openHandle.open);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			withCloseButton
			size="lg"
			title={
				<ModalTitle>Embed generator</ModalTitle>
			}
		>
			<Embedder />
		</Modal>
	);
}