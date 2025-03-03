import { Stack, TextInput, Group, Button, Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { escapeIdent } from "surrealdb";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { activateDatabase, executeQuery } from "~/screens/surrealist/connection/connection";
import { iconPlus } from "~/util/icons";

export function openCreateNamespaceModal() {
	openModal({
		modalId: "create-namespace",
		title: <PrimaryTitle>Create new namespace</PrimaryTitle>,
		withCloseButton: true,
		children: <CreateNamespace />,
	});
}

function CreateNamespace() {
	const [namespaceName, setNamespaceName] = useInputState("");

	const closeCreator = useStable(() => closeModal("create-namespace"));

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async () => {
			await executeQuery(`DEFINE NAMESPACE ${escapeIdent(namespaceName)}`);
			await activateDatabase(namespaceName, "");

			closeCreator();
		},
	});

	return (
		<Form onSubmit={mutateAsync}>
			<Stack>
				<Text>
					Namespaces represent a layer of separation for each organization, department, or
					development team.
				</Text>
				<TextInput
					placeholder="Enter namespace name"
					value={namespaceName}
					onChange={setNamespaceName}
					spellCheck={false}
					autoFocus
				/>
				<LearnMore
					href="https://surrealdb.com/docs/surrealdb/introduction/concepts/namespace"
					mb="xl"
				>
					Learn more about namespaces
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
						rightSection={<Icon path={iconPlus} />}
					>
						Create
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
