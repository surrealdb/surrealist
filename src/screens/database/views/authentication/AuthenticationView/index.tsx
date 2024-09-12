import {
	iconAccount,
	iconAuth,
	iconChevronDown,
	iconChevronRight,
	iconKey,
	iconOpen,
} from "~/util/icons";

import { Box, Button, Group, Menu, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { type ChangeEvent, memo, useMemo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsConnected } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useSaveable } from "~/hooks/save";
import { useDatabaseSchema, useNamespaceSchema, useRootSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useViewEffect } from "~/hooks/view";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/database/connection/connection";
import type { AuthTarget, AuthType, SchemaAccess, SchemaFunction, SchemaUser } from "~/types";
import { buildFunctionDefinition, syncConnectionSchema } from "~/util/schema";
import { AuthenticationPanel } from "../AuthenticationPanel";
import { AccessEditorPanel } from "../AccessEditorPanel";
import { UserEditorPanel } from "../UserEditorPanel";

const AuthenticationPanelLazy = memo(AuthenticationPanel);
const AccessEditorPanelLazy = memo(AccessEditorPanel);
const UserEditorPanelLazy = memo(UserEditorPanel);

export function AuthenticationView() {
	const isConnected = useIsConnected();

	const kvSchema = useRootSchema();
	const nsSchema = useNamespaceSchema();
	const dbSchema = useDatabaseSchema();

	const [listType, setListType] = useState<AuthType>("user");

	const [active, setActive] = useState<AuthTarget | null>(null);
	const [isNew, setIsNew] = useState(false);
	const [showCreator, showCreatorHandle] = useDisclosure();
	const [createName, setCreateName] = useInputState("");
	const [createType, setCreateType] = useState<AuthType>("user");

	const users = useMemo(
		() => [...kvSchema.users, ...nsSchema.users, ...dbSchema.users],
		[kvSchema.users, nsSchema.users, dbSchema.users],
	);

	const accesses = useMemo(
		() => [...kvSchema.accesses, ...nsSchema.accesses, ...dbSchema.accesses],
		[kvSchema.accesses, nsSchema.accesses, dbSchema.accesses],
	);

	const openCreator = useStable((type: AuthType) => {
		showCreatorHandle.open();
		setCreateName("");
		setCreateType(type);
	});

	const editAuthentication = useStable((target: AuthTarget) => {
		setIsNew(false);
		setActive(target);
	});

	const createAuthentication = useStable(async () => {
		showCreatorHandle.close();

		setIsNew(true);
		setActive([createType, createName]);
	});

	const removeAuthentication = useConfirmation({
		message: "You are about to remove this function. This action cannot be undone.",
		confirmText: "Remove",
		onConfirm: async ([type, name]: AuthTarget) => {
			const what = type === "user" ? "USER" : "ACCESS";

			await executeQuery(`REMOVE ${what} ${name}`);
			await syncConnectionSchema();

			setActive(null);
		},
	});

	useViewEffect("authentication", () => {
		syncConnectionSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box
				h="100%"
				ref={ref}
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					<Panel
						defaultSize={minSize}
						minSize={minSize}
						maxSize={35}
					>
						<AuthenticationPanelLazy
							list={listType}
							users={users}
							active={active}
							accesses={accesses}
							onChangeList={setListType}
							onCreate={openCreator}
							onDelete={removeAuthentication}
							onSelect={editAuthentication}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={minSize}>
						{active?.[0] === "user" ? (
							<UserEditorPanelLazy />
						) : active?.[0] === "access" ? (
							<AccessEditorPanelLazy />
						) : (
							<Introduction
								title="Authentication"
								icon={iconAuth}
								snippet={{
									code: `
										-- Define a system user
										DEFINE USER username ON ROOT
											PASSWORD '123456'
											ROLES OWNER;

										-- Define record user access
										DEFINE ACCESS user ON DATABASE TYPE RECORD
											SIGNUP ( ... )
											SIGNIN ( ... );
									`,
								}}
							>
								<Text>
									Manage the system users and access methods configured for the
									instance, namespace, and database.
								</Text>
								<Group>
									<Menu position="bottom">
										<Menu.Target>
											<Button
												flex={1}
												variant="gradient"
												rightSection={<Icon path={iconChevronDown} />}
												disabled={!isConnected}
											>
												New authentication
											</Button>
										</Menu.Target>
										<Menu.Dropdown w={200}>
											<Menu.Item
												onClick={() => openCreator("user")}
												leftSection={<Icon path={iconAccount} />}
											>
												Create user
											</Menu.Item>
											<Menu.Item
												onClick={() => openCreator("access")}
												leftSection={<Icon path={iconKey} />}
											>
												Create access method
											</Menu.Item>
										</Menu.Dropdown>
									</Menu>
									<Button
										flex={1}
										color="slate"
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										onClick={() =>
											adapter.openUrl(
												"https://surrealdb.com/docs/surrealdb/security/authentication",
											)
										}
									>
										Learn more
									</Button>
								</Group>
							</Introduction>
						)}
					</Panel>
				</PanelGroup>
			</Box>

			<Modal
				opened={showCreator}
				onClose={showCreatorHandle.close}
				title={
					<PrimaryTitle>
						Create new {createType === "user" ? "system user" : "access method"}
					</PrimaryTitle>
				}
			>
				<Form onSubmit={createAuthentication}>
					<Stack>
						<TextInput
							placeholder={createType === "user" ? "username" : "name"}
							value={createName}
							spellCheck={false}
							onChange={setCreateName}
							autoFocus
						/>
						<Group mt="lg">
							<Button
								onClick={showCreatorHandle.close}
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
								disabled={!createName}
								rightSection={<Icon path={iconChevronRight} />}
							>
								Continue
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</>
	);
}

export default AuthenticationView;
