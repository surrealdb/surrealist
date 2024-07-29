import { ActionIcon, Button, Divider, Group, Menu, Modal, Stack, Text, TextInput } from "@mantine/core";
import { iconPlus } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { Entry } from "~/components/Entry";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { activateDatabase, executeQuery } from "../../connection";
import { useBoolean } from "~/hooks/boolean";
import { fetchNamespaceList } from "~/util/databases";
import { useQuery } from "@tanstack/react-query";
import { getAuthLevel } from "~/util/connection";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Form } from "~/components/Form";
import { useInputState } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { mdiFolderOutline } from "@mdi/js";
import { tb } from "~/util/helpers";

export function NamespaceList() {
	const [opened, openHandle] = useBoolean();
	const connection = useActiveConnection();
	const connected = useIsConnected();

	const level = getAuthLevel(connection.authentication);

	const { data, refetch } = useQuery({
		queryKey: ["namespaces", connection?.id, opened],
		enabled: connected,
		queryFn: fetchNamespaceList,
		initialData: [],
	});

	const openNamespace = (ns: string) => {
		activateDatabase(ns, "");
		openHandle.set(false);
	};

	const [showCreator, creatorHandle] = useBoolean();
	const [namespaceName, setNamespaceName] = useInputState("");

	const openCreator = useStable(() => {
		setNamespaceName("");
		creatorHandle.set(true);
		openHandle.close();
	});

	const createNamespace = useStable(async () => {
		await executeQuery(`DEFINE NAMESPACE ${tb(namespaceName)}`);

		refetch();

		creatorHandle.close();
		openNamespace(namespaceName);
	});

	return (
		<>
			<Menu
				opened={opened}
				onChange={openHandle.set}
				trigger="click"
				position="bottom-start"
				transitionProps={{
					transition: "scale-y"
				}}
			>
				<Menu.Target>
					<Button
						pl="sm"
						variant="subtle"
						color="slate"
						disabled={!connected}
						leftSection={
							<Icon
								path={mdiFolderOutline}
							/>
						}
					>
						<Text truncate fw={600} maw={200}>
							{connection.lastNamespace || "Select namespace"}
						</Text>
					</Button>
				</Menu.Target>
				<Menu.Dropdown w={250}>
					<Stack flex={1} p="md">
						<Group>
							<Text
								flex={1}
								fw={600}
								c="bright"
							>
								Namespaces
							</Text>
							<ActionIcon
								color="slate"
								variant="light"
								disabled={!connected || (level !== "root" && level !== "namespace")}
								onClick={openCreator}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Group>
						<Divider color="slate.6" />
						{data.length === 0 ? (
							<Text c="slate">
								No namespaces defined
							</Text>
						) : data.map((db) => (
							<Entry
								key={db}
								onClick={() => openNamespace(db)}
								isActive={db === connection.lastNamespace}
								h={28}
							>
								{db}
							</Entry>
						))}
					</Stack>
				</Menu.Dropdown>
			</Menu>

			<Modal
				opened={showCreator}
				onClose={creatorHandle.close}
				trapFocus={false}
				size="sm"
				title={
					<PrimaryTitle>Create new namespace</PrimaryTitle>
				}
			>
				<Form onSubmit={createNamespace}>
					<Stack>
						<TextInput
							placeholder="Enter namespace name"
							value={namespaceName}
							onChange={setNamespaceName}
							spellCheck={false}
							autoFocus
						/>
						<Group mt="lg">
							<Button
								onClick={creatorHandle.close}
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
								rightSection={<Icon path={iconPlus} />}
							>
								Create
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</>
	);
}