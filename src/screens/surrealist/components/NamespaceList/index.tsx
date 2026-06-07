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
import { clsx, Icon, iconNamespace, iconPlus, iconSearch, iconTrash } from "@surrealdb/ui";
import { useMutation } from "@tanstack/react-query";
import { type KeyboardEvent, type SyntheticEvent, useMemo } from "react";
import { escapeIdent } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useKeyNavigation } from "~/hooks/keys";
import { useRootSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openNewDatabaseModal } from "~/modals/new-database";
import { useConfirmation } from "~/providers/Confirmation";
import { getAuthLevel, getAuthNS } from "~/util/connection";
import { createBaseAuthentication } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import { parseIdent } from "~/util/language";
import { activateDatabase, executeQuery } from "../../pages/Connection/connection/connection";
import classes from "./style.module.scss";

export interface NamespaceProps {
	value: string;
	activeNamespace: string;
	selected: boolean;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Namespace({ value, activeNamespace, selected, onOpen, onRemove }: NamespaceProps) {
	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		message: () => (
			<Stack className="selectable">
				<Text lineClamp={3}>
					You are about to delete the namespace{" "}
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
					be undone. Your tables, records, and other resources within contained databases
					will be permanently deleted and cannot be recovered.
				</Text>
			</Stack>
		),
		confirmText: "Delete namespace",
		verification: "delete",
		onConfirm: async () => {
			await executeQuery(/* surql */ `REMOVE NAMESPACE ${escapeIdent(value)}`);

			if (activeNamespace === value) {
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
		<Menu.Item
			data-navigation-item-id={value}
			variant={value === activeNamespace ? "gradient" : undefined}
			onClick={open}
			className={clsx(classes.namespace, selected && classes.namespaceActive)}
			rightSection={
				<ActionButton
					variant="transparent"
					className={classes.namespaceOptions}
					onClick={requestRemove}
					label="Delete namespace"
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

export interface NamespaceListProps {
	buttonProps?: ButtonProps;
}

export function NamespaceList({ buttonProps }: NamespaceListProps) {
	const [opened, openHandle] = useBoolean();
	const connected = useIsConnected();
	const schema = useRootSchema();
	const [search, setSearch] = useInputState("");

	const [namespace, authentication] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.authentication ?? createBaseAuthentication(),
	]);

	const level = getAuthLevel(authentication);

	const namespaces = useMemo(() => {
		const authNS = getAuthNS(authentication);

		if (authNS) {
			return [authNS];
		}

		return schema.namespaces
			.filter((ns) => fuzzyMatch(search, ns.name))
			.map((ns) => parseIdent(ns.name));
	}, [schema, authentication, search]);

	const navigationItems = useMemo(() => namespaces.map((ns) => ({ id: ns })), [namespaces]);
	const menuItems = opened ? navigationItems : [];

	const { mutate, isPending } = useMutation({
		mutationFn: async (ns: string) => {
			if (namespace !== ns) {
				await activateDatabase(ns, "");
			}

			openHandle.close();
		},
	});

	const activate = useStable((item: { id: string }) => {
		mutate(item.id);
	});

	const [handleKeyDown, selected] = useKeyNavigation(menuItems, activate, namespace || undefined);

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

	const willCreate = level === "root" && namespaces.length === 0 && !namespace;

	return willCreate ? (
		<Button
			px="sm"
			color="obsidian"
			variant="light"
			leftSection={<Icon path={iconNamespace} />}
			onClick={openNewDatabaseModal}
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
					variant={namespace ? "subtle" : "light"}
					color="obsidian"
					leftSection={<Icon path={iconNamespace} />}
					{...buttonProps}
				>
					<Text
						truncate
						fw={600}
						maw={200}
					>
						{namespace || "Select namespace"}
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
							placeholder="Loading namespaces..."
							leftSection={<Loader size={14} />}
							variant="unstyled"
							readOnly
						/>
					) : (
						<TextInput
							flex={1}
							placeholder="Search namespaces"
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
						label="Create namespace"
						onClick={openCreator}
					>
						<Icon path={iconPlus} />
					</ActionButton>
				</Group>
				<Menu.Divider />
				<ScrollArea.Autosize mah={350}>
					{namespaces.length === 0 ? (
						<Text
							c="obsidian"
							py="md"
							ta="center"
						>
							No namespaces found
						</Text>
					) : (
						<Stack
							gap="xs"
							p="xs"
						>
							{namespaces.map((ns) => (
								<Namespace
									key={ns}
									value={ns}
									activeNamespace={namespace}
									selected={selected === ns}
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
