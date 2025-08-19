import { Button, Group, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";

interface DeleteFolderModalProps {
	folderName: string;
	contentDescription: string;
	currentDirectoryName?: string;
	onMoveToCurrentDirectory: () => void;
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
	currentDirectoryName,
	onMoveToCurrentDirectory,
	onDeleteEverything,
}: DeleteFolderModalProps) {
	const closeCreator = useStable(() => closeModal("delete-folder"));

	const handleMoveToCurrentDirectory = useStable(() => {
		closeCreator();
		onMoveToCurrentDirectory();
	});

	const handleDeleteEverything = useStable(() => {
		closeCreator();
		onDeleteEverything();
	});

	// Generate button text based on current directory
	const moveButtonText = currentDirectoryName
		? `Move to "${currentDirectoryName}"`
		: "Move to root";

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
					onClick={handleMoveToCurrentDirectory}
					variant="light"
				>
					{moveButtonText}
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
