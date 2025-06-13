import classes from "./style.module.scss";

import {
	Button,
	type ButtonProps,
	Divider,
	Group,
	Loader,
	Menu,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";

import { useMutation } from "@tanstack/react-query";
import { type SyntheticEvent, useMemo } from "react";
import { escapeIdent } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useNamespaceSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openCreateDatabaseModal } from "~/modals/create-database";
import { useConfirmation } from "~/providers/Confirmation";
import { getAuthDB, getAuthLevel } from "~/util/connection";
import { createBaseAuthentication } from "~/util/defaults";
import { iconClose, iconDatabase, iconPlus } from "~/util/icons";
import { parseIdent } from "~/util/surrealql";
import { activateDatabase, executeQuery } from "../../connection/connection";

export interface DatabaseProps {
	value: string;
	activeNamespace: string;
	activeDatabase: string;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Database({ value, activeNamespace, activeDatabase, onOpen, onRemove }: DatabaseProps) {
	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		title: "Remove database",
		message: `Are you sure you want to remove the database "${value}"?`,
		confirmText: "Remove",
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
		<Entry
			py={5}
			h="unset"
			radius="xs"
			onClick={open}
			isActive={value === activeDatabase}
			className={classes.database}
			rightSection={
				<ActionButton
					variant="transparent"
					className={classes.databaseOptions}
					onClick={requestRemove}
					label="Remove database"
					size="xs"
				>
					<Icon
						path={iconClose}
						size="sm"
					/>
				</ActionButton>
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
	const connected = useIsConnected();
	const schema = useNamespaceSchema();

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

		return schema.databases.map((db) => parseIdent(db.name));
	}, [schema, authentication]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (db: string) => {
			if (database !== db) {
				await activateDatabase(namespace, db);
			}

			openHandle.close();
		},
	});

	const openCreator = useStable(() => {
		openCreateDatabaseModal();
		openHandle.close();
	});

	const willCreate =
		(level === "root" || level === "namespace") && databases.length === 0 && !database;

	return willCreate ? (
		<Button
			px="sm"
			color="slate"
			variant="light"
			leftSection={<Icon path={iconDatabase} />}
			onClick={openCreateDatabaseModal}
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
			position="bottom-start"
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				<Button
					px="sm"
					variant={database ? "subtle" : "light"}
					color="slate"
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
			<Menu.Dropdown w={250}>
				<Stack
					flex={1}
					p="sm"
				>
					<Group gap="sm">
						<Text
							fw={600}
							c="bright"
						>
							Databases
						</Text>
						{isPending && <Loader size={14} />}
						<Spacer />
						<ActionButton
							color="slate"
							variant="light"
							disabled={!connected || (level !== "root" && level !== "namespace")}
							label="Create database"
							onClick={openCreator}
						>
							<Icon path={iconPlus} />
						</ActionButton>
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
										activeNamespace={namespace}
										activeDatabase={database}
										onOpen={mutate}
										onRemove={openHandle.close}
									/>
								))}
							</Stack>
						)}
					</ScrollArea.Autosize>
				</Stack>
			</Menu.Dropdown>
		</Menu>
	);
}
