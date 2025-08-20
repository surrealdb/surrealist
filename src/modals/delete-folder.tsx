import { Button, Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
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
		title: <PrimaryTitle>Delete Folder "{props.folderName}"?</PrimaryTitle>,
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
		<Stack gap="xl">
			<Text
				fw={500}
				c="dimmed"
			>
				{contentDescription}
			</Text>

			<Stack gap="sm">
				<Button
					onClick={handleMoveToCurrentDirectory}
					variant="light"
					size="sm"
				>
					{moveButtonText}
				</Button>
				<Button
					onClick={handleDeleteEverything}
					color="red"
					variant="filled"
					size="sm"
				>
					Delete everything
				</Button>
				<Button
					onClick={closeCreator}
					variant="subtle"
					color="slate"
					size="sm"
				>
					Cancel
				</Button>
			</Stack>
		</Stack>
	);
}
