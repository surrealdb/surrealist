import { Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useEffect } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConnection } from "~/hooks/connection";
import { SelectDatabase } from "~/screens/surrealist/components/SelectDatabase";

export function openRequiredDatabaseModal(callback: () => void) {
	openModal({
		modalId: "require-database",
		title: <PrimaryTitle>Before you continue...</PrimaryTitle>,
		withCloseButton: true,
		children: <NamespaceDatabaseSelector onSelect={callback} />,
	});
}

interface NamespaceDatabaseSelectorProps {
	onSelect: () => void;
}

function NamespaceDatabaseSelector({ onSelect }: NamespaceDatabaseSelectorProps) {
	const hasDatabase = useConnection((c) => !!c?.lastDatabase);

	useEffect(() => {
		if (hasDatabase) {
			closeModal("require-database");
			onSelect();
		}
	}, [hasDatabase, onSelect]);

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
		</Stack>
	);
}
