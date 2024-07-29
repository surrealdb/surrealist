import { ActionIcon, Button, Divider, Group, Menu, Modal, Stack, Text, TextInput } from "@mantine/core";
import { iconPlus } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { Entry } from "~/components/Entry";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { activateDatabase, executeQuery } from "../../connection";
import { useBoolean } from "~/hooks/boolean";
import { fetchDatabaseList } from "~/util/databases";
import { useQuery } from "@tanstack/react-query";
import { getAuthLevel } from "~/util/connection";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Form } from "~/components/Form";
import { useInputState } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { mdiDatabaseOutline } from "@mdi/js";
import { tb } from "~/util/helpers";

export function DatabaseList() {
	const [opened, openHandle] = useBoolean();
	const connection = useActiveConnection();
	const connected = useIsConnected();

	const namespace = connection.lastNamespace;
	const level = getAuthLevel(connection.authentication);

	const { data, refetch } = useQuery({
		queryKey: ["databases", connection.id, namespace, opened],
		enabled: connected && !!namespace,
		queryFn: () => fetchDatabaseList(namespace),
		initialData: [],
	});

	const openDatabase = (db: string) => {
		activateDatabase(namespace, db);
		openHandle.set(false);
	};

	const [showCreator, creatorHandle] = useBoolean();
	const [databaseName, setDatabaseName] = useInputState("");

	const openCreator = useStable(() => {
		setDatabaseName("");
		creatorHandle.set(true);
		openHandle.close();
	});

	const createDatabase = useStable(async () => {
		await executeQuery(`DEFINE DATABASE ${tb(databaseName)}`);

		refetch();

		creatorHandle.close();
		openDatabase(databaseName);
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
						disabled={!connected || !connection.lastNamespace}
						leftSection={
							<Icon
								path={mdiDatabaseOutline}
							/>
						}
					>
						<Text truncate fw={600} maw={200}>
							{connection.lastDatabase || "Select database"}
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
								Databases
							</Text>
							<ActionIcon
								color="slate"
								variant="light"
								disabled={!connected || level !== "root"}
								onClick={openCreator}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Group>
						<Divider color="slate.6" />
						{data.length === 0 ? (
							<Text c="slate">
								No databases defined
							</Text>
						) : data.map((db) => (
							<Entry
								key={db}
								onClick={() => openDatabase(db)}
								isActive={db === connection.lastDatabase}
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
					<PrimaryTitle>Create new database</PrimaryTitle>
				}
			>
				<Form onSubmit={createDatabase}>
					<Stack>
						<TextInput
							placeholder="Enter database name"
							value={databaseName}
							onChange={setDatabaseName}
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