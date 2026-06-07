import {
	Autocomplete,
	Button,
	Divider,
	Group,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconDatabase, iconNamespace } from "@surrealdb/ui";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { escapeIdent } from "surrealdb";
import { Form } from "~/components/Form";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConnection } from "~/hooks/connection";
import { useRootSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import {
	activateDatabase,
	executeQuery,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import { parseIdent } from "~/util/language";
import { syncConnectionSchema } from "~/util/schema";

export function openNewDatabaseModal() {
	openModal({
		modalId: "new-database",
		title: <PrimaryTitle>Create new database</PrimaryTitle>,
		withCloseButton: true,
		trapFocus: false,
		children: <NewDatabaseModal />,
	});
}

function NewDatabaseModal() {
	const rootSchema = useRootSchema();
	const [currentNamespace] = useConnection((c) => [c?.lastNamespace ?? ""]);

	const existingNamespaces = useMemo(
		() => rootSchema.namespaces.map((ns) => parseIdent(ns.name)),
		[rootSchema],
	);

	const [namespace, setNamespace] = useInputState(currentNamespace);
	const [database, setDatabase] = useInputState("");

	const handleClose = useStable(() => {
		closeModal("new-database");
	});

	const submitMutation = useMutation({
		mutationFn: async () => {
			await executeQuery(`
				DEFINE NAMESPACE IF NOT EXISTS ${escapeIdent(namespace)};
				USE NS ${escapeIdent(namespace)};
				DEFINE DATABASE IF NOT EXISTS ${escapeIdent(database)};
			`);

			await syncConnectionSchema({
				clearRoot: true,
				clearNamespace: true,
				clearDatabase: true,
			});

			await activateDatabase(namespace, database);

			handleClose();
		},
	});

	return (
		<Form onSubmit={submitMutation.mutate}>
			<Stack gap="xl">
				<Text>Your new database will be created within the specified namespace.</Text>

				<Divider mx="-xl" />

				<SimpleGrid cols={2}>
					<Autocomplete
						label="Namespace"
						data={existingNamespaces}
						placeholder="my_namespace"
						value={namespace}
						onChange={setNamespace}
						leftSection={<Icon path={iconNamespace} />}
					/>
					<TextInput
						label="Database"
						placeholder="my_database"
						value={database}
						onChange={setDatabase}
						leftSection={<Icon path={iconDatabase} />}
						data-autofocus
					/>
				</SimpleGrid>

				<Divider mx="-xl" />

				<Group>
					<LearnMore
						href="https://surrealdb.com/docs/surrealdb/introduction/concepts/database"
						flex={1}
					>
						Learn more about databases
					</LearnMore>
					<Button
						onClick={handleClose}
						color="obsidian"
						variant="light"
					>
						Cancel
					</Button>
					<Button
						loading={submitMutation.isPending}
						disabled={!namespace || !database}
						variant="gradient"
						type="submit"
					>
						Create
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
