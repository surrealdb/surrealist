import classes from "./style.module.scss";
import { ActionIcon, Button, ButtonProps, Divider, Group, Menu, Modal, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { iconClose, iconPlus } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { Entry } from "~/components/Entry";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { activateDatabase, executeQuery } from "../../connection/connection";
import { useBoolean } from "~/hooks/boolean";
import { fetchNamespaceList } from "~/util/databases";
import { useQuery } from "@tanstack/react-query";
import { getAuthLevel } from "~/util/connection";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Form } from "~/components/Form";
import { useInputState } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { mdiFolderOutline } from "@mdi/js";
import { escapeIdent } from "~/util/surrealql";
import { LearnMore } from "~/components/LearnMore";
import { SyntheticEvent } from "react";
import { useConfirmation } from "~/providers/Confirmation";

export interface NamespaceProps {
	value: string;
	isActive: boolean;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Namespace({
	value,
	isActive,
	onOpen,
	onRemove,
}: NamespaceProps) {

	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		title: "Remove namespace",
		message: `Are you sure you want to remove the namespace "${value}"?`,
		confirmText: "Remove",
		onConfirm() {
			executeQuery(/* surql */ `REMOVE NAMESPACE ${escapeIdent(value)}`);
			activateDatabase("", "");
		},
	});

	const requestRemove = useStable((e: SyntheticEvent) => {
		e.stopPropagation();
		remove();
		onRemove();
	});

	return (
		<Entry
			h={34}
			radius="xs"
			onClick={open}
			isActive={isActive}
			className={classes.namespace}
			rightSection={
				<ActionIcon
					component="div"
					className={classes.namespaceOptions}
					onClick={requestRemove}
					aria-label="Remove namespace"
					size="xs"
				>
					<Icon path={iconClose} size="sm" />
				</ActionIcon>
			}
		>
			{value}
		</Entry>
	);
}

export interface NamespaceListProps {
	buttonProps?: ButtonProps;
}

export function NamespaceList({
	buttonProps
}: NamespaceListProps) {
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
		if (connection.lastNamespace !== ns) {
			activateDatabase(ns, "");
		}

		openHandle.close();
	};

	const [showCreator, creatorHandle] = useBoolean();
	const [namespaceName, setNamespaceName] = useInputState("");

	const openCreator = useStable(() => {
		setNamespaceName("");
		creatorHandle.set(true);
		openHandle.close();
	});

	const createNamespace = useStable(async () => {
		await executeQuery(`DEFINE NAMESPACE ${escapeIdent(namespaceName)}`);

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
				position="bottom"
				transitionProps={{
					transition: "scale-y"
				}}
			>
				<Menu.Target>
					<Button
						px="sm"
						variant={connection.lastNamespace ? "subtle" : "light"}
						color="slate"
						leftSection={
							<Icon
								path={mdiFolderOutline}
							/>
						}
						{...buttonProps}
					>
						<Text
							truncate
							fw={600}
							maw={200}
							c={buttonProps?.disabled ? undefined : "bright"}
						>
							{connection.lastNamespace || "Select namespace"}
						</Text>
					</Button>
				</Menu.Target>
				<Menu.Dropdown w={250}>
					<Stack
						flex={1}
						p="sm"
						gap="sm"
					>
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
						<ScrollArea.Autosize mah={250}>
							{data.length === 0 ? (
								<Text c="slate">
									No namespaces defined
								</Text>
							) : data.map((ns) => (
								<Namespace
									key={ns}
									value={ns}
									isActive={ns === connection.lastNamespace}
									onOpen={openNamespace}
									onRemove={openHandle.close}
								/>
							))}
						</ScrollArea.Autosize>
					</Stack>
				</Menu.Dropdown>
			</Menu>

			<Modal
				opened={showCreator}
				onClose={creatorHandle.close}
				trapFocus={false}
				size="md"
				title={
					<PrimaryTitle>Create new namespace</PrimaryTitle>
				}
			>
				<Form onSubmit={createNamespace}>
					<Stack>
						<Text>
							Namespaces represent a layer of separation for each organisation, department, or development team.
						</Text>
						<TextInput
							placeholder="Enter namespace name"
							value={namespaceName}
							onChange={setNamespaceName}
							spellCheck={false}
							autoFocus
						/>
						<LearnMore
							href="https://surrealdb.com/docs/surrealdb/surrealql/statements/define/namespace"
							mb="xl"
						>
							Learn more about namespaces
						</LearnMore>
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