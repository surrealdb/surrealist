import { Avatar, Badge, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import surrealImg from "~/assets/images/surrealdb.png";
import { CloudTicketUser } from "~/types";
import { formatRelativeDate } from "~/util/helpers";

export interface TicketPartAuthorDetailsProps {
	user?: CloudTicketUser;
	updated_at: number;
	children?: React.ReactNode;
}

export function TicketPartAuthorDetails({
	user,
	updated_at,
	children,
}: TicketPartAuthorDetailsProps) {
	return (
		<Group
			gap="xl"
			wrap="nowrap"
			align="start"
		>
			<Avatar
				radius="md"
				size={36}
				name={user?.name ?? "SurrealDB Team"}
				src={
					user?.avatar ??
					(!user || user?.type === "admin" || user.type === "bot"
						? surrealImg
						: undefined)
				}
				bg={!user || user.type === "admin" || user.type === "bot" ? "surreal.0" : undefined}
				component={UnstyledButton}
				style={{
					cursor: "default",
				}}
			></Avatar>

			<Stack>
				<Stack gap={0}>
					<Group gap="xs">
						<Text
							c="bright"
							fz="lg"
							fw={700}
						>
							{user?.name ?? "SurrealDB Team"}
						</Text>
						{user?.type === "admin" && (
							<Badge
								size="sm"
								variant="light"
								color="surreal"
							>
								Support agent
							</Badge>
						)}
						{user?.type === "bot" && (
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
						c="slate.3"
					>
						{formatRelativeDate(updated_at * 1000)}
					</Text>
				</Stack>
				{children}
			</Stack>
		</Group>
	);
}
