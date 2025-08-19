import { Button, Group, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";

interface DeleteFolderModalProps {
	folderName: string;
	contentDescription: string;
	onMoveToRoot: () => void;
	onDeleteEverything: () => void;
}

export function openDeleteFolderModal(props: DeleteFolderModalProps) {
	openModal({
		modalId: "delete-folder",
		title: <PrimaryTitle>Delete "{props.folderName}"?</PrimaryTitle>,
		withCloseButton: true,
		children: <DeleteFolderModal {...props} />,
	});
}

function DeleteFolderModal({
	contentDescription,
	onMoveToRoot,
	onDeleteEverything,
}: DeleteFolderModalProps) {
	const closeCreator = useStable(() => closeModal("delete-folder"));

	const handleMoveToRoot = useStable(() => {
		closeCreator();
		onMoveToRoot();
	});

	const handleDeleteEverything = useStable(() => {
		closeCreator();
		onDeleteEverything();
	});

	return (
		<>
			<Text
				fz="lg"
				mb="md"
			>
				{contentDescription}
			</Text>

			<Text
				fw="bold"
				mb="xs"
			>
				Choose an action:
			</Text>

			<Group mt="xl">
				<Button
					onClick={closeCreator}
					variant="light"
					color="slate"
				>
					Cancel
				</Button>
				<Spacer />
				<Button
					onClick={handleMoveToRoot}
					variant="light"
				>
					Move to root
				</Button>
				<Button
					onClick={handleDeleteEverything}
					color="red"
				>
					Delete everything
				</Button>
			</Group>
		</>
	);
}
