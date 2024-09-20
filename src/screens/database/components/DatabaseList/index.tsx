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
import { getAuthDB, getAuthLevel } from "~/util/connection";
import { iconClose, iconDatabase, iconPlus } from "~/util/icons";
import { escapeIdent, parseIdent } from "~/util/surrealql";
import { activateDatabase, executeQuery } from "../../connection/connection";
import { useNamespaceSchema } from "~/hooks/schema";

export interface DatabaseProps {
	value: string;
	isActive: boolean;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Database({ value, isActive, onOpen, onRemove }: DatabaseProps) {
	const { lastNamespace, lastDatabase } = useActiveConnection();

	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		title: "Remove database",
		message: `Are you sure you want to remove the database "${value}"?`,
		confirmText: "Remove",
		onConfirm() {
			executeQuery(/* surql */ `REMOVE DATABASE ${escapeIdent(value)}`);

			if (lastDatabase === value) {
				activateDatabase(lastNamespace, "");
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
			className={classes.database}
			rightSection={
				<ActionIcon
					component="div"
					variant="transparent"
					className={classes.databaseOptions}
					onClick={requestRemove}
					aria-label="Remove database"
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

export interface DatabaseListProps {
	buttonProps?: ButtonProps;
}

export function DatabaseList({ buttonProps }: DatabaseListProps) {
	const [opened, openHandle] = useBoolean();
	const connection = useActiveConnection();
	const connected = useIsConnected();
	const schema = useNamespaceSchema();

	const namespace = connection.lastNamespace;
	const level = getAuthLevel(connection.authentication);

	const databases = useMemo(() => {
		const authDB = getAuthDB(connection.authentication);

		if (authDB) {
			return [authDB];
		}

		return schema.databases.map((db) => parseIdent(db.name));
	}, [schema, connection.authentication]);

	const openDatabase = (db: string) => {
		if (connection.lastDatabase !== db) {
			activateDatabase(namespace, db);
		}

		openHandle.close();
	};

	const [showCreator, creatorHandle] = useBoolean();
	const [databaseName, setDatabaseName] = useInputState("");

	const openCreator = useStable(() => {
		setDatabaseName("");
		creatorHandle.set(true);
		openHandle.close();
	});

	const createDatabase = useStable(async () => {
		await executeQuery(`DEFINE DATABASE ${escapeIdent(databaseName)}`);

		creatorHandle.close();
		openDatabase(databaseName);
	});

	const willCreate = (level === "root" || level === "namespace") && databases.length === 0;

	return (
		<>
			{willCreate ? (
				<Button
					px="sm"
					color="slate"
					variant="light"
					leftSection={<Icon path={iconDatabase} />}
					onClick={openCreator}
					{...buttonProps}
				>
					<Text
						truncate
						fw={600}
						maw={200}
					>
						Create database
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
							variant={connection.lastDatabase ? "subtle" : "light"}
							color="slate"
							leftSection={<Icon path={iconDatabase} />}
							{...buttonProps}
						>
							<Text
								truncate
								fw={600}
								maw={200}
							>
								{connection.lastDatabase || "Select database"}
							</Text>
						</Button>
					</Menu.Target>
					<Menu.Dropdown w={250}>
						<Stack
							flex={1}
							p="sm"
						>
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
									disabled={!connected || (level !== "root" && level !== "namespace")}
									onClick={openCreator}
								>
									<Icon path={iconPlus} />
								</ActionIcon>
							</Group>
							<Divider />
							<ScrollArea.Autosize mah={250}>
								{databases.length === 0 ? (
									<Text c="slate">No databases defined</Text>
								) : (
									<Stack gap="xs">
										{databases.map((db) => (
											<Database
												key={db}
												value={db}
												isActive={db === connection.lastDatabase}
												onOpen={() => openDatabase(db)}
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
				title={<PrimaryTitle>Create new database</PrimaryTitle>}
			>
				<Form onSubmit={createDatabase}>
					<Stack>
						<Text>
							Databases represent isolated containers within a namespace encompassing
							schemas, tables, and records.
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
