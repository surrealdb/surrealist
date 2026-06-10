import {
	Button,
	Checkbox,
	Divider,
	Group,
	Modal,
	PasswordInput,
	ScrollArea,
	Stack,
	Tabs,
	Textarea,
	TextInput,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { Icon, iconCheck, iconPlus } from "@surrealdb/ui";
import { useLayoutEffect, useState } from "react";
import { escapeIdent } from "surrealdb";
import { Form } from "~/components/Form";
import { CodeInput } from "~/components/Inputs";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { executeQuery } from "~/screens/surrealist/pages/Connection/connection/connection";
import type { Base, SchemaUser } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";

const ROLES = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

export interface UserEditorModalProps {
	level: Base;
	existing: SchemaUser | null;
	opened: boolean;
	list: SchemaUser[];
	onClose: () => void;
}

export function UserEditorModal({ level, existing, opened, list, onClose }: UserEditorModalProps) {
	const [activeTab, setActiveTab] = useState("general");
	const [target, setTarget] = useState<SchemaUser | null>(null);
	const [username, setUsername] = useInputState("");
	const [password, setPassword] = useInputState("");
	const [sessionDuration, setSessionDuration] = useState("");
	const [tokenDuration, setTokenDuration] = useState("");
	const [roles, setRoles] = useState<string[]>([]);
	const [comment, setComment] = useInputState("");

	useLayoutEffect(() => {
		if (opened) {
			setTarget(existing);
			setUsername(existing?.name ?? "");
			setRoles(existing?.roles ?? []);
			setComment(existing?.comment ?? "");
			setPassword("");

			if (existing) {
				setTokenDuration(existing.duration.token?.toString() ?? "");
				setSessionDuration(existing.duration.session?.toString() ?? "");
			} else {
				setTokenDuration("1h");
				setSessionDuration("");
			}
		}
	}, [opened, existing]);

	const saveUser = useStable(async () => {
		try {
			let query = `DEFINE USER OVERWRITE ${escapeIdent(username)} ON ${level}`;

			if (target && !password) {
				query += ` PASSHASH "${target.hash}"`;
			} else {
				query += ` PASSWORD "${password}"`;
			}

			if (roles.length > 0) {
				query += ` ROLES ${roles.join(", ")}`;
			}

			query += ` DURATION FOR TOKEN ${tokenDuration || "NONE"} FOR SESSION ${sessionDuration || "NONE"}`;

			if (comment) {
				query += ` COMMENT "${comment}"`;
			}

			await executeQuery(query);
			await syncConnectionSchema();
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to save user",
				content: err,
			});
		} finally {
			onClose();
		}
	});

	const isConflicting = !existing && list.some((user) => user.name === username);
	const isValid =
		!isConflicting && username.length > 0 && password.length > 0 && roles.length > 0;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			scrollAreaComponent={ScrollArea.Autosize}
			size={500}
			title={
				<PrimaryTitle>
					{existing
						? `Editing user ${existing.name}`
						: `Create ${level.toLowerCase()} user`}
				</PrimaryTitle>
			}
		>
			<Form onSubmit={saveUser}>
				<Tabs
					value={activeTab}
					onChange={setActiveTab as any}
					variant="surreal"
				>
					<Tabs.List>
						<Tabs.Tab value="general">General</Tabs.Tab>
						<Tabs.Tab value="durations">Durations</Tabs.Tab>
						<Tabs.Tab value="comment">Comment</Tabs.Tab>
					</Tabs.List>

					<Divider mb="xl" />

					<Tabs.Panel value="general">
						<Stack gap="lg">
							{!target && (
								<TextInput
									label="User name"
									placeholder="admin"
									value={username}
									spellCheck={false}
									onChange={setUsername}
									error={isConflicting && "This name is already in use"}
									data-autofocus
									required
								/>
							)}
							<PasswordInput
								label={target ? "New password" : "Password"}
								description={
									target
										? "Leave blank to keep the current password"
										: "The password for this user"
								}
								placeholder="Enter password"
								value={password}
								spellCheck={false}
								onChange={setPassword}
								required={!target}
							/>

							<Checkbox.Group
								label="Select a role"
								description="The role of the user on this database"
								value={roles}
								onChange={setRoles}
								withAsterisk
							>
								<Stack mt="xs">
									{ROLES.map((role) => (
										<Checkbox
											{...role}
											key={role.value}
										/>
									))}
								</Stack>
							</Checkbox.Group>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="durations">
						<Stack gap="lg">
							<CodeInput
								label="Token duration"
								description="The duration of the token used to establish an authenticated session"
								placeholder="No duration set"
								value={tokenDuration}
								onChange={setTokenDuration}
							/>

							<CodeInput
								label="Session duration"
								description="The duration of the authenticated session established with the token"
								placeholder="No duration set"
								value={sessionDuration}
								onChange={setSessionDuration}
							/>

							<LearnMore href="https://surrealdb.com/docs/learn/security/authentication/authentication#expiration">
								Learn more about session and token durations
							</LearnMore>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="comment">
						<Textarea
							placeholder="Enter optional description for this user"
							value={comment}
							onChange={setComment}
							rows={5}
						/>
					</Tabs.Panel>
				</Tabs>

				<Group mt="xl">
					<Button
						onClick={onClose}
						color="obsidian"
						variant="light"
						flex={1}
					>
						Close
					</Button>
					<Button
						type="submit"
						variant="gradient"
						flex={1}
						disabled={!isValid}
						rightSection={<Icon path={target ? iconCheck : iconPlus} />}
					>
						{target ? "Save user" : "Create user"}
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
