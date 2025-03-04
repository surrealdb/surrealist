import { Button, Group, Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useEffect } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { SelectDatabase } from "~/screens/surrealist/components/SelectDatabase";

export function openRequiredDatabaseModal(callback: () => void) {
	openModal({
		modalId: "require-database",
		title: <PrimaryTitle>Namespace & database</PrimaryTitle>,
		withCloseButton: true,
		children: <NamespaceDatabaseSelector onSelect={callback} />,
	});
}

interface NamespaceDatabaseSelectorProps {
	onSelect: () => void;
}

function NamespaceDatabaseSelector({ onSelect }: NamespaceDatabaseSelectorProps) {
	const hasDatabase = useConnection((c) => !!c?.lastDatabase);

	const closeSelector = useStable(() => closeModal("require-database"));

	const proceed = useStable(() => {
		closeSelector();
		onSelect();
	});

	return (
		<Stack>
			<Text>
				Please select a namespace and database before you continue. You can use the buttons
				below to choose an existing namespace and database, or create new ones.
			</Text>
			<SelectDatabase
				mt="lg"
				withNamespace
				withDatabase
			/>
			<Group mt="xl">
				<Button
					color="slate"
					variant="light"
					onClick={closeSelector}
				>
					Close
				</Button>
				<Spacer />
				<Button
					type="submit"
					disabled={!hasDatabase}
					variant="gradient"
					onClick={proceed}
				>
					Continue
				</Button>
			</Group>
		</Stack>
	);
}
