import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconPlus } from "@surrealdb/ui";
import { useMutation } from "@tanstack/react-query";
import { escapeIdent } from "surrealdb";
import { Form } from "~/components/Form";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { activateDatabase, executeQuery } from "~/screens/surrealist/connection/connection";
import { getConnection } from "~/util/connection";

export function openCreateDatabaseModal() {
	openModal({
		modalId: "create-database",
		title: <PrimaryTitle>Create new database</PrimaryTitle>,
		withCloseButton: true,
		trapFocus: false,
		children: <CreateDatabase />,
	});
}

function CreateDatabase() {
	const [databaseName, setDatabaseName] = useInputState("");

	const closeCreator = useStable(() => closeModal("create-database"));

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async () => {
			const connection = getConnection();
			const namespace = connection?.lastNamespace ?? "";

			await executeQuery(`DEFINE DATABASE ${escapeIdent(databaseName)}`);
			await activateDatabase(namespace, databaseName);

			closeCreator();
		},
	});

	return (
		<Form onSubmit={mutateAsync}>
			<Stack>
				<Text>
					Databases represent isolated containers within a namespace encompassing schemas,
					tables, and records.
				</Text>
				<TextInput
					placeholder="Enter database name"
					value={databaseName}
					onChange={setDatabaseName}
					spellCheck={false}
					autoFocus
				/>
				<LearnMore
					href="https://surrealdb.com/docs/surrealdb/introduction/concepts/database"
					mb="xl"
				>
					Learn more about databases
				</LearnMore>
				<Group>
					<Button
						onClick={closeCreator}
						color="slate"
						variant="light"
						flex={1}
					>
						Close
					</Button>
					<Button
						type="submit"
						variant="gradient"
						flex={1}
						loading={isPending}
						disabled={!databaseName}
						rightSection={<Icon path={iconPlus} />}
					>
						Create
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
