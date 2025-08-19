import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";

interface DeleteFolderCascadeModalProps {
	folderName: string;
	contentDescription: string;
	onConfirm: () => void;
}

export function openDeleteFolderCascadeModal(props: DeleteFolderCascadeModalProps) {
	openModal({
		modalId: "delete-folder-cascade",
		title: <PrimaryTitle>Delete "{props.folderName}" and all contents?</PrimaryTitle>,
		withCloseButton: true,
		children: <DeleteFolderCascadeModal {...props} />,
	});
}

function DeleteFolderCascadeModal({
	contentDescription,
	onConfirm,
}: DeleteFolderCascadeModalProps) {
	const [confirmText, setConfirmText] = useInputState("");
	const closeCreator = useStable(() => closeModal("delete-folder-cascade"));

	const handleConfirm = useStable(() => {
		closeCreator();
		onConfirm();
	});

	const isConfirmed = confirmText === "CONFIRM";

	return (
		<Form onSubmit={handleConfirm}>
			<Stack>
				<Text fz="lg">{contentDescription}</Text>

				<Text
					fz="lg"
					c="red"
					fw="bold"
				>
					This action cannot be undone.
				</Text>

				<TextInput
					value={confirmText}
					onChange={setConfirmText}
					placeholder="CONFIRM"
					label="Type CONFIRM to delete everything"
					autoFocus
					onKeyDown={(event) => {
						if (event.key === "Enter" && isConfirmed) {
							handleConfirm();
						}
					}}
				/>

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
						type="submit"
						color="red"
						disabled={!isConfirmed}
					>
						Delete everything
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
