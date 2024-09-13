import {
	Button,
	Checkbox,
	Group,
	Modal,
	PasswordInput,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { executeQuery } from "~/screens/database/connection/connection";
import type { Base, SchemaUser } from "~/types";
import { showError } from "~/util/helpers";
import { iconCheck, iconPlus } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";

const ROLES = [
	{ value: "owner", label: "Owner" },
	{ value: "editor", label: "Editor" },
	{ value: "viewer", label: "Viewer" },
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
	const [roles, setRoles] = useState<string[]>([]);
	const [comment, setComment] = useInputState("");

	useLayoutEffect(() => {
		if (opened) {
			setTarget(existing);
			setUsername(existing?.name ?? "");
			setRoles(existing?.roles ?? []);
			setComment(existing?.comment ?? "");
			setPassword("");
		}
	}, [opened, existing]);

	const saveUser = useStable(async () => {
		try {
			let query = `DEFINE USER OVERWRITE ${username} ON ${level}`;

			if (target && !password) {
				query += ` PASSHASH ${target.hash}`;
			} else {
				query += ` PASSWORD "${password}"`;
			}

			if (roles.length > 0) {
				query += ` ROLES ${roles.join(", ")}`;
			}

			if (comment) {
				query += ` COMMENT "${comment}"`;
			}

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
			title={
				<PrimaryTitle>
					{existing
						? `Editing user ${existing.name}`
						: `Create ${level.toLowerCase()} user`}
				</PrimaryTitle>
			}
		>
			<Form onSubmit={saveUser}>
				<Stack gap="xl">
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

					<Textarea
						label="Comment"
						description="Optional description for this user"
						placeholder="Enter comment"
						value={comment}
						onChange={setComment}
						rows={5}
					/>

					<Group mt="lg">
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
				</Stack>
			</Form>
		</Modal>
	);
}
