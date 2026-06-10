import {
	Button,
	type ButtonProps,
	Group,
	Loader,
	Menu,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { clsx, Icon, iconDatabase, iconPlus, iconSearch, iconTrash } from "@surrealdb/ui";
import { useMutation } from "@tanstack/react-query";
import { type KeyboardEvent, type SyntheticEvent, useMemo } from "react";
import { escapeIdent } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useKeyNavigation } from "~/hooks/keys";
import { useNamespaceSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openNewDatabaseModal } from "~/modals/new-database";
import { useConfirmation } from "~/providers/Confirmation";
import { getAuthDB, getAuthLevel } from "~/util/connection";
import { createBaseAuthentication } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import { parseIdent } from "~/util/language";
import { activateDatabase, executeQuery } from "../../pages/Connection/connection/connection";
import classes from "./style.module.scss";

export interface DatabaseProps {
	value: string;
	activeNamespace: string;
	activeDatabase: string;
	selected: boolean;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Database({
	value,
	activeNamespace,
	activeDatabase,
	selected,
	onOpen,
	onRemove,
}: DatabaseProps) {
	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		message: () => (
			<Stack className="selectable">
				<Text lineClamp={3}>
					You are about to delete the database{" "}
					<Text
						span
						c="bright"
						fw={600}
					>
						{value}
					</Text>
					.
				</Text>
				<Text>
					This action{" "}
					<Text
						span
						fw={600}
						c="bright"
					>
						CANNOT
					</Text>{" "}
					be undone. Your tables, records, and other resources in this database will be
					permanently deleted and cannot be recovered.
				</Text>
			</Stack>
		),
		confirmText: "Delete database",
		verification: "delete",
		onConfirm: async () => {
			await executeQuery(/* surql */ `REMOVE DATABASE ${escapeIdent(value)}`);

			if (activeDatabase === value) {
				activateDatabase(activeNamespace, "");
			}
		},
	});

	const requestRemove = useStable((e: SyntheticEvent) => {
		e.stopPropagation();
		remove();
		onRemove();
	});

	return (
		<Menu.Item
			data-navigation-item-id={value}
			variant={value === activeDatabase ? "gradient" : undefined}
			onClick={open}
			className={clsx(classes.database, selected && classes.databaseActive)}
			rightSection={
				<ActionButton
					variant="transparent"
					className={classes.databaseOptions}
					onClick={requestRemove}
					label="Delete database"
					size="xs"
				>
					<Icon
						path={iconTrash}
						size="sm"
					/>
				</ActionButton>
			}
		>
			<Text
				maw={215}
				truncate
				title={value}
			>
				{value}
			</Text>
		</Menu.Item>
	);
}

export interface DatabaseListProps {
	buttonProps?: ButtonProps;
}

export function DatabaseList({ buttonProps }: DatabaseListProps) {
	const [opened, openHandle] = useBoolean();
	const connected = useIsConnected();
	const schema = useNamespaceSchema();
	const [search, setSearch] = useInputState("");

	const [namespace, database, authentication] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication ?? createBaseAuthentication(),
	]);

	const level = getAuthLevel(authentication);

	const databases = useMemo(() => {
		const authDB = getAuthDB(authentication);

		if (authDB) {
			return [authDB];
		}

		return schema.databases
			.filter((db) => fuzzyMatch(search, db.name))
			.map((db) => parseIdent(db.name));
	}, [schema, authentication, search]);

	const navigationItems = useMemo(() => databases.map((db) => ({ id: db })), [databases]);
	const menuItems = opened ? navigationItems : [];

	const { mutate, isPending } = useMutation({
		mutationFn: async (db: string) => {
			if (database !== db) {
				await activateDatabase(namespace, db);
			}

			openHandle.close();
		},
	});

	const activate = useStable((item: { id: string }) => {
		mutate(item.id);
	});

	const [handleKeyDown, selected] = useKeyNavigation(menuItems, activate, database || undefined);

	const handleSearchKeyDown = useStable((event: KeyboardEvent<HTMLInputElement>) => {
		handleKeyDown(event);

		if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
			event.stopPropagation();
		}
	});

	const handleMenuChange = useStable((value: boolean) => {
		openHandle.set(value);

		if (!value) {
			setSearch("");
		}
	});

	const openCreator = useStable(() => {
		openNewDatabaseModal();
		openHandle.close();
	});

	const willCreate =
		(level === "root" || level === "namespace") && databases.length === 0 && !database;

	return willCreate ? (
		<Button
			px="sm"
			color="obsidian"
			variant="light"
			leftSection={<Icon path={iconDatabase} />}
			onClick={openNewDatabaseModal}
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
			onChange={handleMenuChange}
			trigger="hover"
			position="bottom-start"
			trapFocus={false}
			withInitialFocusPlaceholder={false}
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				<Button
					px="md"
					variant={database ? "subtle" : "light"}
					color="obsidian"
					leftSection={<Icon path={iconDatabase} />}
					{...buttonProps}
				>
					<Text
						truncate
						fw={600}
						maw={200}
					>
						{database || "Select database"}
					</Text>
				</Button>
			</Menu.Target>
			<Menu.Dropdown
				miw={225}
				maw={275}
			>
				<Group
					gap="sm"
					p="xs"
				>
					{isPending ? (
						<TextInput
							flex={1}
							placeholder="Loading databases..."
							leftSection={<Loader size={14} />}
							variant="unstyled"
							readOnly
						/>
					) : (
						<TextInput
							flex={1}
							placeholder="Search databases"
							leftSection={<Icon path={iconSearch} />}
							variant="unstyled"
							autoFocus
							value={search}
							onChange={setSearch}
							onKeyDown={handleSearchKeyDown}
						/>
					)}
					<ActionButton
						color="obsidian"
						variant="light"
						disabled={!connected || (level !== "root" && level !== "namespace")}
						label="Create database"
						onClick={openCreator}
					>
						<Icon path={iconPlus} />
					</ActionButton>
				</Group>
				<Menu.Divider />
				<ScrollArea.Autosize mah={350}>
					{databases.length === 0 ? (
						<Text
							c="obsidian"
							py="md"
							ta="center"
						>
							No databases found
						</Text>
					) : (
						<Stack
							gap="xs"
							p="xs"
						>
							{databases.map((db) => (
								<Database
									key={db}
									value={db}
									activeNamespace={namespace}
									activeDatabase={database}
									selected={selected === db}
									onOpen={mutate}
									onRemove={openHandle.close}
								/>
							))}
						</Stack>
					)}
				</ScrollArea.Autosize>
			</Menu.Dropdown>
		</Menu>
	);
}
