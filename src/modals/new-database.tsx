import {
	Autocomplete,
	Button,
	Divider,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconDatabase, iconNamespace } from "@surrealdb/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { SchemaInfoNS } from "~/types";
import { parseIdent } from "~/util/language";
import { syncConnectionSchema } from "~/util/schema";

export function openNewDatabaseModal() {
	openModal({
		modalId: "new-database",
		title: <PrimaryTitle>Create new database</PrimaryTitle>,
		withCloseButton: true,
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
	const [description, setDescription] = useInputState("");

	const [debouncedDatabase] = useDebouncedValue(database, 300);

	const handleClose = useStable(() => {
		closeModal("new-database");
	});

	const existsQuery = useQuery({
		queryKey: ["database-exists", namespace, debouncedDatabase],
		enabled: !!namespace && !!debouncedDatabase,
		queryFn: async () => {
			const [_, result] = await executeQuery(`
				USE NS ${escapeIdent(namespace)};
				INFO FOR NS STRUCTURE;
			`);

			const { databases } = result.result as SchemaInfoNS;

			return databases.some((db) => db.name === debouncedDatabase);
		},
	});

	const submitMutation = useMutation({
		mutationFn: async () => {
			if (existsQuery.isPending) return;

			await executeQuery(
				`
				DEFINE NAMESPACE IF NOT EXISTS ${escapeIdent(namespace)};
				USE NS ${escapeIdent(namespace)};
				DEFINE DATABASE IF NOT EXISTS ${escapeIdent(debouncedDatabase)} COMMENT $comment;
			`,
				{
					comment: description || undefined,
				},
			);

			await syncConnectionSchema({
				clearRoot: true,
				clearNamespace: true,
				clearDatabase: true,
			});

			await activateDatabase(namespace, debouncedDatabase);

			handleClose();
		},
	});

	const databaseError = existsQuery.data
		? "Database already exists in this namespace"
		: undefined;

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
						required
					/>
					<TextInput
						label="Database"
						placeholder="my_database"
						value={database}
						onChange={setDatabase}
						leftSection={<Icon path={iconDatabase} />}
						data-autofocus
						required
						withAsterisk
						error={databaseError}
						withErrorStyles
					/>
				</SimpleGrid>

				<Textarea
					label="Description"
					placeholder="A description of the database (optional)"
					value={description}
					onChange={setDescription}
				/>

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
						disabled={!namespace || !debouncedDatabase || existsQuery.data}
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
