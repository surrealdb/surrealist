import { Badge, Checkbox, PasswordInput, Stack, Textarea } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import equal from "fast-deep-equal";
import { useLayoutEffect, useState } from "react";
import { ContentPane } from "~/components/Pane";
import type { AuthTarget, SchemaUser } from "~/types";
import { iconAccount } from "~/util/icons";

const ROLES = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

export interface UserEditorPanelProps {
	users: SchemaUser[];
	active: AuthTarget;
	isNew: boolean;
}

export function UserEditorPanel({ active, isNew, users }: UserEditorPanelProps) {
	const [editing, setEditing] = useState<AuthTarget | null>(null);

	const [password, setPassword] = useInputState("");
	const [comment, setComment] = useInputState("");
	const [roles, setRoles] = useState<string[]>([]);

	useLayoutEffect(() => {
		if (equal(active, editing)) return;
		
		if (active) {
			const user = users.find((user) => user.name === active[1]);

			if (user) {
				setEditing(active);
				setRoles(user.roles);
				setComment(user.comment);
			}
		}
	}, [active, users, editing]);

	return (
		<ContentPane
			title="User Editor"
			icon={iconAccount}
			infoSection={
				isNew && (
					<Badge
						ml="xs"
						variant="light"
					>
						Creating
					</Badge>
				)
			}
		>
			<Stack
				p="md"
				gap="xl"
				maw={500}
			>
				<PasswordInput
					label={isNew ? "Password" : "New password"}
					description={
						isNew
							? "The password for this user"
							: "Leave blank to keep the current password"
					}
					placeholder="Enter password"
					value={password}
					spellCheck={false}
					onChange={setPassword}
					required={isNew}
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
			</Stack>
		</ContentPane>
	);
}
