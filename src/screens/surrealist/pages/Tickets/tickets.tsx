import {
	Badge,
	Box,
	Button,
	Group,
	Menu,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import dayjs from "dayjs";
import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { useCloudTicketsQuery } from "~/cloud/queries/tickets";
import { ActionButton } from "~/components/ActionButton";
import { CloudSplash } from "~/components/CloudSplash";
import { Icon } from "~/components/Icon";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TICKET_STATES } from "~/constants";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { iconFilter, iconSearch } from "~/util/icons";
import classes from "./style.module.scss";

export interface OrganizationTicketsPageProps {
	organization: string;
}

export function OrganizationTicketsPage({ organization }: OrganizationTicketsPageProps) {
	const isAuthed = useIsAuthenticated();
	const [body, setBody] = useInputState("");
	const [, navigate] = useLocation();

	const pagination = usePagination();
	const startAt = (pagination.currentPage - 1) * pagination.pageSize;

	const { data: tickets, isPending: ticketsPending } = useCloudTicketsQuery(organization);
	const { data: org, isPending: orgPending } = useCloudOrganizationQuery(organization);

	const pageSlice = tickets?.slice(startAt, startAt + pagination.pageSize);

	useLayoutEffect(() => {
		pagination.setPageSize(10);
		pagination.setTotal(tickets?.length ?? 0);
	}, [pagination.setTotal, pagination.setPageSize, tickets?.length]);

	const submitTicket = useStable(() => {});

	if (!isAuthed) {
		return <CloudSplash />;
	}

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
			>
				<Box
					flex={1}
					mx="auto"
					maw={900}
					pb={96}
				>
					<Group mb="xl">
						<Stack gap={2.5}>
							<PrimaryTitle>Support Tickets</PrimaryTitle>
							<Text fz="lg">Showing all tickets for {org?.name}.</Text>
						</Stack>
					</Group>

					<Group
						mb="xl"
						gap="xs"
					>
						<TextInput
							placeholder="Search tickets..."
							leftSection={<Icon path={iconSearch} />}
							spellCheck={false}
							variant="unstyled"
							autoFocus
							size="xs"
						/>
						<Menu>
							<Menu.Target>
								<div>
									<ActionButton label="Filter tickets">
										<Icon path={iconFilter} />
									</ActionButton>
								</div>
							</Menu.Target>
							<Menu.Dropdown>
								{Object.entries(TICKET_STATES).map(([key, value]) => (
									<Menu.Item key={key}>{value.label}</Menu.Item>
								))}
							</Menu.Dropdown>
						</Menu>
						<Spacer />
						<Button
							size="xs"
							variant="gradient"
						>
							Create Ticket
						</Button>
					</Group>

					<Skeleton visible={ticketsPending}>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>ID</Table.Th>
									<Table.Th>Title</Table.Th>
									<Table.Th>Category</Table.Th>
									<Table.Th>Contacts</Table.Th>
									<Table.Th w={96}>Status</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{(!pageSlice || pageSlice?.length === 0) && (
									<Table.Tr>
										<Table.Td colSpan={5}>
											<Text
												ta="center"
												mt="xl"
												fz="lg"
											>
												No tickets found
											</Text>
										</Table.Td>
									</Table.Tr>
								)}
								{pageSlice?.map((ticket) => (
									<UnstyledButton
										key={ticket.id}
										component={Table.Tr}
										onClick={() => {
											navigate(`t/${ticket.id}/o/${organization}`);
										}}
									>
										<Table.Td
											fw={500}
											fz="lg"
											c="bright"
										>
											#{ticket.id}
										</Table.Td>
										<Table.Td>
											<Stack>
												<Text>{ticket.title}</Text>
												<Text>
													{dayjs(ticket.created_at).format(
														"MMMM D, YYYY - HH:mm A",
													)}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>{ticket.type.name}</Table.Td>
										<Table.Td>
											{ticket.contacts
												.map((contact) => contact.name)
												.join(", ")}
										</Table.Td>
										<Table.Td>
											<Badge
												variant="light"
												color={TICKET_STATES[ticket.state.category].color}
											>
												{TICKET_STATES[ticket.state.category].label}
											</Badge>
										</Table.Td>
									</UnstyledButton>
								))}
							</Table.Tbody>
						</Table>
					</Skeleton>
					<Spacer />
					<Group
						mt="xl"
						justify="center"
					>
						<Pagination store={pagination} />
					</Group>
				</Box>
			</ScrollArea>
		</Box>
	);
}

export default OrganizationTicketsPage;
