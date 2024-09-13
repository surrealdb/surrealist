import { iconChevronRight, iconFolderSecure, iconServer, iconServerSecure } from "~/util/icons";

import { Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { memo, useMemo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsConnected } from "~/hooks/connection";
import { useDatabaseSchema, useNamespaceSchema, useRootSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useViewEffect } from "~/hooks/view";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/database/connection/connection";
import type { AuthTarget, AuthType } from "~/types";
import { syncConnectionSchema } from "~/util/schema";
import { LearnMore } from "~/components/LearnMore";
import { LevelPanel } from "../LevelPanel";
import { mdiDatabaseOutline } from "@mdi/js";

const LevelPanelLazy = memo(LevelPanel);

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

	return (
		<>
			<Box h="100%">
				<PanelGroup direction="horizontal">
					<Panel minSize={15}>
						<LevelPanelLazy
							level="ROOT"
							color="red"
							icon={iconServerSecure}
							users={users}
							accesses={accesses}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={15}>
						<LevelPanelLazy
							level="NAMESPACE"
							color="blue"
							icon={iconFolderSecure}
							users={users}
							accesses={accesses}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={15}>
						<LevelPanelLazy
							level="DATABASE"
							color="orange"
							icon={mdiDatabaseOutline}
							users={users}
							accesses={accesses}
						/>
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
						<Text>
							{createType === "user"
								? "System users are used to authenticate with an instance, namespace, or database"
								: "Access methods provide fine grained control over the data accessible by a user"}
						</Text>
						<TextInput
							placeholder={createType === "user" ? "username" : "name"}
							value={createName}
							spellCheck={false}
							onChange={setCreateName}
							autoFocus
						/>
						{createType === "user" ? (
							<LearnMore
								href="https://surrealdb.com/docs/surrealdb/security/authentication#system-users"
								mb="xl"
							>
								Learn more about system users
							</LearnMore>
						) : (
							<LearnMore
								href="https://surrealdb.com/docs/surrealql/statements/define/access"
								mb="xl"
							>
								Learn more about access methods
							</LearnMore>
						)}
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
