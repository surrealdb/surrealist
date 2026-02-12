import { Avatar, Badge, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import surrealImg from "~/assets/images/surrealdb.png";
import { CloudOrganization, IntercomUser } from "~/types";
import { formatRelativeDate } from "~/util/helpers";

export interface ConversationPartAuthorProps {
	user?: IntercomUser;
	updated_at: number;
	children?: React.ReactNode;
}

export function ConversationPartAuthor({
	user,
	updated_at,
	children,
}: ConversationPartAuthorProps) {
	return (
		<ConversationUser
			name={user?.name ?? "SurrealDB Team"}
			type={user?.type ?? "user"}
			image={user?.avatar}
			updated_at={updated_at}
		>
			{children}
		</ConversationUser>
	);
}

export interface ConversationOrganizationProps {
	organization: CloudOrganization;
	updated_at: number;
	children?: React.ReactNode;
}

export function ConversationOrganization({
	organization,
	updated_at,
	children,
}: ConversationOrganizationProps) {
	return (
		<ConversationUser
			name={organization.name}
			type="organization"
			updated_at={updated_at}
		>
			{children}
		</ConversationUser>
	);
}

export interface ConversationUserProps {
	name: string;
	type: "admin" | "user" | "bot" | "organization";
	updated_at: number;
	image?: string;
	icon?: React.ReactNode;
	children?: React.ReactNode;
}

export function ConversationUser({
	name,
	type,
	image,
	icon,
	updated_at,
	children,
}: ConversationUserProps) {
	return (
		<Group
			gap="xl"
			wrap="nowrap"
			align="start"
		>
			{!icon && (
				<Avatar
					radius="md"
					size={36}
					name={name}
					src={image ?? (type === "admin" || type === "bot" ? surrealImg : undefined)}
					bg={type === "admin" || type === "bot" ? "surreal.0" : undefined}
					component={UnstyledButton}
					style={{
						cursor: "default",
					}}
				/>
			)}

			{icon && icon}

			<Stack>
				<Stack gap={0}>
					<Group gap="xs">
						<Text
							c="bright"
							fz="lg"
							fw={700}
						>
							{name}
						</Text>
						{type === "organization" && (
							<Badge
								size="sm"
								variant="light"
								color="violet"
							>
								Org
							</Badge>
						)}
						{type === "admin" && (
							<Badge
								size="sm"
								variant="light"
								color="violet"
							>
								Agent
							</Badge>
						)}
						{type === "bot" && (
							<Badge
								size="sm"
								variant="light"
								color="violet"
							>
								Bot
							</Badge>
						)}
					</Group>
					<Text
						fz="sm"
						c="obsidian.3"
					>
						{formatRelativeDate(updated_at * 1000)}
					</Text>
				</Stack>
				{children}
			</Stack>
		</Group>
	);
}
