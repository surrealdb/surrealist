import {
	Badge,
	Center,
	Divider,
	Group,
	Indicator,
	Loader,
	Menu,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconChat, iconChevronDown, iconFilter, iconTag, Spacer } from "@surrealdb/ui";
import { useEffect, useMemo, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { IntercomConversation, IntercomTicket } from "~/types";
import { formatRelativeDate } from "~/util/helpers";
import { Pagination } from "../Pagination";
import { usePagination } from "../Pagination/hook";
import classes from "./style.module.scss";

type SortMode = "opened_newest" | "opened_oldest" | "updated_latest" | "updated_oldest";

export type ConversationOrTicket = IntercomConversation | IntercomTicket;

function isIntercomConversation(item: ConversationOrTicket): item is IntercomConversation {
	return "last_response_author" in item;
}

export interface ConversationTableProps {
	conversations: ConversationOrTicket[];
	headerBackground?: string;
	isLoading?: boolean;
	withHeader?: boolean;
	defaultType?: "open" | "closed";
	defaultSortMode?: SortMode;
}

export interface ConversationRowProps {
	conversation: ConversationOrTicket;
}

export function ConversationRow({ conversation }: ConversationRowProps) {
	const htmlRegex = /(<([^>]+)>)/gi;
	const isConversation = isIntercomConversation(conversation);

	const ticketOrganization = isConversation
		? conversation.ticketData?.attributes?.Organisation
		: (conversation as IntercomTicket).attributes?.Organisation;

	const { data: organization } = useCloudOrganizationQuery(ticketOrganization);

	const hasTicket = isConversation ? conversation.hasTicket : true;
	const color = hasTicket ? "violet" : "pink";
	const icon = hasTicket ? iconTag : iconChat;

	const title = conversation.title?.replace(htmlRegex, "") || `Conversation #${conversation.id}`;
	const authorName = isConversation
		? conversation.last_response_author?.name
		: (conversation as IntercomTicket).parts[(conversation as IntercomTicket).parts.length - 1]
				?.author?.name;
	const read = isConversation ? conversation.read : true;
	const showOrganization = hasTicket && organization;

	return (
		<>
			<Divider m={0} />
			<Group
				onClick={() => navigate(`/support/conversations/${conversation.id}`)}
				className={classes.conversationCard}
			>
				<ThemeIcon
					size={40}
					variant="light"
					color={color}
				>
					<Icon path={icon} />
				</ThemeIcon>
				<Stack gap={2.5}>
					<Group>
						<Text
							fz="lg"
							fw={read ? 400 : 600}
							c="bright"
						>
							{title}
						</Text>
						{!read && (
							<Indicator
								inset={0}
								size={8}
								color="violet"
							/>
						)}
					</Group>
					<Group gap={4}>
						<Text c={hasTicket ? "violet" : "pink"}>{authorName || "Unknown"}</Text>
						<Text
							c="obsidian.4"
							fz={4}
							mx={2}
						>
							&#x2B24;
						</Text>
						<Text>{formatRelativeDate(conversation.updated_at * 1000)}</Text>
						{showOrganization && <Text>in {organization?.name ?? "Unknown"}</Text>}
					</Group>
				</Stack>
			</Group>
		</>
	);
}

export function ConversationTable({
	conversations,
	isLoading,
	headerBackground,
	withHeader = true,
	defaultType = "open",
	defaultSortMode = "updated_latest",
}: ConversationTableProps) {
	const [selectedTab, setSelectedTab] = useState<"open" | "closed">(defaultType);

	const [sortMode, setSortMode] = useState<SortMode>(defaultSortMode);
	const sortModes: { label: string; value: SortMode }[] = [
		{
			label: "Opened Newest",
			value: "opened_newest",
		},
		{
			label: "Opened Oldest",
			value: "opened_oldest",
		},
		{
			label: "Updated Latest",
			value: "updated_latest",
		},
		{
			label: "Updated Oldest",
			value: "updated_oldest",
		},
	];

	const filteredConversations = useMemo(() => {
		return conversations
			.filter((conversation) =>
				selectedTab === "open" ? conversation.open : !conversation.open,
			)
			.sort((a, b) => {
				if (sortMode === "opened_newest") {
					return b.created_at - a.created_at;
				} else if (sortMode === "opened_oldest") {
					return a.created_at - b.created_at;
				} else if (sortMode === "updated_latest") {
					return b.updated_at - a.updated_at;
				} else if (sortMode === "updated_oldest") {
					return a.updated_at - b.updated_at;
				}
				return 0;
			});
	}, [conversations, selectedTab, sortMode]);

	const pagination = usePagination();
	const startAt = (pagination.currentPage - 1) * pagination.pageSize;
	const pageSlice = filteredConversations?.slice(startAt, startAt + pagination.pageSize) ?? [];

	useEffect(() => {
		pagination.setTotal(filteredConversations?.length || 0);
	}, [pagination.setTotal, filteredConversations]);

	return (
		<Stack gap={2.5}>
			{withHeader && (
				<Group
					gap="xs"
					bg={headerBackground}
					className={classes.conversationTableHeader}
				>
					<UnstyledButton
						className={classes.headerButton}
						onClick={() => setSelectedTab("open")}
					>
						<Group gap="sm">
							<Text
								fz="md"
								fw={selectedTab === "open" ? 800 : undefined}
								c={selectedTab === "open" ? "bright" : undefined}
							>
								Open
							</Text>
							<Badge style={{ cursor: "pointer" }}>
								{conversations.filter((it) => it.open).length}
							</Badge>
						</Group>
					</UnstyledButton>
					<UnstyledButton
						className={classes.headerButton}
						onClick={() => setSelectedTab("closed")}
					>
						<Group gap="sm">
							<Text
								fz="md"
								fw={selectedTab === "closed" ? 800 : undefined}
								c={selectedTab === "closed" ? "bright" : undefined}
							>
								Closed
							</Text>
							<Badge style={{ cursor: "pointer" }}>
								{conversations.filter((it) => !it.open).length}
							</Badge>
						</Group>
					</UnstyledButton>

					<Spacer />

					<Menu>
						<Menu.Target>
							<UnstyledButton className={classes.headerButton}>
								<Group gap="sm">
									<Icon path={iconFilter} />
									<Text
										c="bright"
										fw={800}
									>
										{sortModes.find((it) => it.value === sortMode)?.label}
									</Text>
									<Icon path={iconChevronDown} />
								</Group>
							</UnstyledButton>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Label>Sort by</Menu.Label>
							{sortModes.map((it) => (
								<Menu.Item
									my="sm"
									py="xs"
									key={it.value}
									onClick={() => setSortMode(it.value)}
								>
									{it.label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
				</Group>
			)}

			{isLoading && (
				<Center my="xl">
					<Loader />
				</Center>
			)}
			{!isLoading &&
				pageSlice.length > 0 &&
				pageSlice.map((conversation) => (
					<ConversationRow
						key={conversation.id}
						conversation={conversation}
					/>
				))}
			{!isLoading && pageSlice.length === 0 && (
				<Center my="xl">
					<Text>There are no {selectedTab} support tickets</Text>
				</Center>
			)}

			{!isLoading && pageSlice.length > 1 && (
				<Group
					justify="center"
					py="xl"
				>
					<Pagination store={pagination} />
				</Group>
			)}
		</Stack>
	);
}
