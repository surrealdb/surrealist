import classes from "./style.module.scss";

import {
	Button,
	type ButtonProps,
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
import { useRootSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openCreateNamespaceModal } from "~/modals/create-namespace";
import { useConfirmation } from "~/providers/Confirmation";
import { getAuthLevel, getAuthNS } from "~/util/connection";
import { createBaseAuthentication } from "~/util/defaults";
import { iconClose, iconNamespace, iconPlus } from "~/util/icons";
import { parseIdent } from "~/util/surrealql";
import { activateDatabase, executeQuery } from "../../connection/connection";

export interface NamespaceProps {
	value: string;
	activeNamespace: string;
	onOpen: (ns: string) => void;
	onRemove: () => void;
}

function Namespace({ value, activeNamespace, onOpen, onRemove }: NamespaceProps) {
	const open = useStable(() => onOpen(value));

	const remove = useConfirmation({
		title: "Remove namespace",
		message: `Are you sure you want to remove the namespace "${value}"?`,
		confirmText: "Remove",
		skippable: true,
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
		<Entry
			py={5}
			h="unset"
			radius="xs"
			onClick={open}
			isActive={value === activeNamespace}
			className={classes.namespace}
			rightSection={
				<ActionButton
					variant="transparent"
					className={classes.namespaceOptions}
					onClick={requestRemove}
					label="Remove namespace"
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

export interface NamespaceListProps {
	buttonProps?: ButtonProps;
}

export function NamespaceList({ buttonProps }: NamespaceListProps) {
	const [opened, openHandle] = useBoolean();
	const connected = useIsConnected();
	const schema = useRootSchema();

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

		return schema.namespaces.map((ns) => parseIdent(ns.name));
	}, [schema, authentication]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (ns: string) => {
			if (namespace !== ns) {
				await activateDatabase(ns, "");
			}

			openHandle.close();
		},
	});

	const openCreator = useStable(() => {
		openCreateNamespaceModal();
		openHandle.close();
	});

	const willCreate = level === "root" && namespaces.length === 0 && !namespace;

	return willCreate ? (
		<Button
			px="sm"
			color="slate"
			variant="light"
			leftSection={<Icon path={iconNamespace} />}
			onClick={openCreateNamespaceModal}
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
			trigger="hover"
			position="bottom-start"
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				<Button
					px="sm"
					variant={namespace ? "subtle" : "light"}
					color="slate"
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
			<Menu.Dropdown w={225}>
				<Group
					gap="sm"
					p="sm"
				>
					<Text
						fw={600}
						c="bright"
					>
						Namespaces
					</Text>
					{isPending && <Loader size={14} />}
					<Spacer />
					<ActionButton
						color="slate"
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
							c="slate"
							py="md"
							ta="center"
						>
							No namespaces defined
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
