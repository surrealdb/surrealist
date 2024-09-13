import classes from "../style.module.scss";

import {
	Accordion,
	Button,
	Checkbox,
	Group,
	Modal,
	PasswordInput,
	ScrollArea,
	Stack,
	Tabs,
	Text,
	Textarea,
	TextInput,
	Title,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { CodeInput } from "~/components/Inputs";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { SectionTitle } from "~/providers/Designer/helpers";
import { executeQuery } from "~/screens/database/connection/connection";
import type { Base, SchemaUser } from "~/types";
import { showError } from "~/util/helpers";
import { iconAccount, iconChat, iconCheck, iconClock, iconHelp, iconPlus } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { escapeIdent } from "~/util/surrealql";

const ROLES = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

export interface UserEditorModalProps {
	level: Base;
	existing: SchemaUser | null;
	opened: boolean;
	onClose: () => void;
}

export function UserEditorModal({ level, existing, opened, onClose }: UserEditorModalProps) {
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
			setSessionDuration(existing?.duration?.session?.toString() ?? "");
			setTokenDuration(existing?.duration?.token?.toString() ?? "1h");
			setPassword("");
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

			const durations: string[] = [];

			if (tokenDuration) {
				durations.push(`FOR TOKEN ${tokenDuration}`);
			}

			if (sessionDuration) {
				durations.push(`FOR SESSION ${sessionDuration}`);
			}

			if (durations.length > 0) {
				query += ` DURATION ${durations.join(", ")}`;
			}

			if (comment) {
				query += ` COMMENT "${comment}"`;
			}

			console.log(query);

			await executeQuery(query);
			await syncConnectionSchema();
		} catch (err: any) {
			showError({
				title: "Failed to save user",
				subtitle: err.message,
			});
		} finally {
			onClose();
		}
	});

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
				<Tabs defaultValue="general">
					<Tabs.List grow mb="xl">
						<Tabs.Tab value="general">General</Tabs.Tab>
						<Tabs.Tab value="durations">Durations</Tabs.Tab>
						<Tabs.Tab value="comment">Comment</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="general">
						<Stack gap="lg">
							{!target && (
								<TextInput
									label="User name"
									placeholder="admin"
									value={username}
									spellCheck={false}
									onChange={setUsername}
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
								placeholder="Enter duration"
								value={tokenDuration}
								onChange={setTokenDuration}
							/>

							<CodeInput
								label="Session duration"
								description="The duration of the authenticated session established with the token"
								placeholder="Enter duration"
								value={sessionDuration}
								onChange={setSessionDuration}
							/>

							<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication#expiration">
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
						rightSection={<Icon path={target ? iconCheck : iconPlus} />}
					>
						{target ? "Save user" : "Create user"}
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
