import classes from "./style.module.scss";

import {
	ActionIcon,
	Button,
	type ButtonProps,
	Divider,
	Group,
	Menu,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { type MouseEvent, useMemo, type SyntheticEvent } from "react";
import { Entry } from "~/components/Entry";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { getAuthLevel, getAuthNS } from "~/util/connection";
import { iconClose, iconNamespace, iconPlus } from "~/util/icons";
import { escapeIdent, parseIdent } from "~/util/surrealql";
import { activateDatabase, executeQuery } from "../../connection/connection";
import { useRootSchema } from "~/hooks/schema";

export interface NamespaceProps {
	value: string;
	isActive: boolean;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Namespace({ value, isActive, onOpen, onRemove }: NamespaceProps) {
	const { lastNamespace } = useActiveConnection();

	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		title: "Remove namespace",
		message: `Are you sure you want to remove the namespace "${value}"?`,
		confirmText: "Remove",
		onConfirm() {
			executeQuery(/* surql */ `REMOVE NAMESPACE ${escapeIdent(value)}`);

			if (value === lastNamespace) {
				activateDatabase("", "");
			}
		},
	});

	const requestRemove = useStable((e: SyntheticEvent) => {
		e.stopPropagation();
		remove();
		onRemove();
	});

	return (
		<Entry
			py={5}
			h="unset"
			radius="xs"
			onClick={open}
			isActive={isActive}
			className={classes.namespace}
			rightSection={
				<ActionIcon
					component="div"
					variant="transparent"
					className={classes.namespaceOptions}
					onClick={requestRemove}
					aria-label="Remove namespace"
					size="xs"
				>
					<Icon
						path={iconClose}
						size="sm"
					/>
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

export function NamespaceList({ buttonProps }: NamespaceListProps) {
	const [opened, openHandle] = useBoolean();
	const connection = useActiveConnection();
	const connected = useIsConnected();
	const schema = useRootSchema();

	const namespaces = useMemo(() => {
		const authNS = getAuthNS(connection.authentication);

		if (authNS) {
			return [authNS];
		}

		return schema.namespaces.map((ns) => parseIdent(ns.name));
	}, [schema, connection.authentication]);

	const level = getAuthLevel(connection.authentication);

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

		creatorHandle.close();
		openNamespace(namespaceName);
	});

	const willCreate = level === "root" && namespaces.length === 0;

	return (
		<>
			{willCreate ? (
				<Button
					px="sm"
					color="slate"
					variant="light"
					leftSection={<Icon path={iconNamespace} />}
					onClick={openCreator}
					{...buttonProps}
				>
					<Text
						truncate
						fw={600}
						maw={200}
					>
						Create namespace
					</Text>
				</Button>
			) : (
				<Menu
					opened={opened}
					onChange={openHandle.set}
					trigger="click"
					position="bottom"
					transitionProps={{
						transition: "scale-y",
					}}
				>
					<Menu.Target>
						<Button
							px="sm"
							variant={connection.lastNamespace ? "subtle" : "light"}
							color="slate"
							leftSection={<Icon path={iconNamespace} />}
							{...buttonProps}
						>
							<Text
								truncate
								fw={600}
								maw={200}
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
							<Divider />
							<ScrollArea.Autosize mah={250}>
								{namespaces.length === 0 ? (
									<Text c="slate">No namespaces defined</Text>
								) : (
									<Stack gap="xs">
										{namespaces.map((ns) => (
											<Namespace
												key={ns}
												value={ns}
												isActive={ns === connection.lastNamespace}
												onOpen={openNamespace}
												onRemove={openHandle.close}
											/>
										))}
									</Stack>
								)}
							</ScrollArea.Autosize>
						</Stack>
					</Menu.Dropdown>
				</Menu>
			)}

			<Modal
				opened={showCreator}
				onClose={creatorHandle.close}
				trapFocus={false}
				size="md"
				title={<PrimaryTitle>Create new namespace</PrimaryTitle>}
			>
				<Form onSubmit={createNamespace}>
					<Stack>
						<Text>
							Namespaces represent a layer of separation for each organisation,
							department, or development team.
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
