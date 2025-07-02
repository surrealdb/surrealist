import {
	Accordion,
	Badge,
	Box,
	Button,
	Divider,
	Grid,
	Group,
	Menu,
	Paper,
	ScrollArea,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
	Textarea,
	UnstyledButton,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { useLocation } from "wouter";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import {
	iconBullhorn,
	iconCursor,
	iconFilter,
	iconHelp,
	iconHistory,
	iconSearch,
	iconTag,
	iconTarget,
} from "~/util/icons";
import classes from "./style.module.scss";
import { useIsAuthenticated } from "~/hooks/cloud";
import { CloudSplash } from "~/components/CloudSplash";

interface HistoryEntry {
	id: number;
	date: string;
	type: string;
	status: "active" | "pending" | "closed";
}

const TYPES = [
	{ label: "Technical", value: "technical" },
	{ label: "Outage", value: "outage" },
	{ label: "Account", value: "account" },
];

const SEVERITIES = [
	{ label: "Low - p4", value: "low" },
	{ label: "Medium - p3", value: "medium" },
	{ label: "High - p2", value: "high" },
	{ label: "Critical - p1", value: "critical" },
];

const SAMPLE_HISTORY: HistoryEntry[] = [
	{ id: 1, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 2, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 3, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 4, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 5, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 6, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 7, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 8, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 9, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 10, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 11, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 12, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 13, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 14, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 15, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 16, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 17, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 18, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 19, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 20, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 21, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 22, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 23, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 24, date: "2021-05-12", type: "Outage", status: "closed" },
	{ id: 25, date: "2021-05-12", type: "Technical", status: "pending" },
	{ id: 26, date: "2021-05-12", type: "Account", status: "active" },
	{ id: 27, date: "2021-05-12", type: "Outage", status: "closed" },
];

const STATUS_COLORS = {
	active: "green",
	pending: "orange",
	closed: "red",
} as const;

export function TicketsPage() {
	const isAuthed = useIsAuthenticated();
	const [body, setBody] = useInputState("");
	const [type, setType] = useState("");
	const [severity, setSeverity] = useState("");
	const [, navigate] = useLocation();

	const pagination = usePagination();
	const startAt = (pagination.currentPage - 1) * pagination.pageSize;
	const pageSlice = SAMPLE_HISTORY.slice(startAt, startAt + pagination.pageSize);

	useLayoutEffect(() => {
		pagination.setPageSize(10);
		pagination.setTotal(SAMPLE_HISTORY.length);
	}, [pagination.setTotal, pagination.setPageSize]);

	const submitTicket = useStable(() => {});

	const canSubmit = type && severity && body;

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
					mx="auto"
					maw={900}
					pb={96}
				>
					<Group
						wrap="nowrap"
						align="start"
					>
						<Box flex={1}>
							<PrimaryTitle>Tickets</PrimaryTitle>
							<Text fz="lg">
								Require direct support from our team? Submit a ticket and we will
								get back to you as soon as possible.
							</Text>
						</Box>
					</Group>

					<Paper
						p="xl"
						mt="xl"
					>
						<Group>
							<Icon
								path={iconTag}
								size="xl"
							/>
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Create new Ticket
							</Text>
						</Group>
						<Divider my="md" />
						<Stack>
							<Textarea
								autosize
								minRows={5}
								label="Describe your issue"
								value={body}
								onChange={setBody}
							/>
							<Group align="end">
								<Select
									data={TYPES}
									label="Issue type"
									placeholder="Please select issue type"
									leftSection={<Icon path={iconBullhorn} />}
									value={type}
									onChange={setType as any}
									maw={225}
									w="100%"
								/>
								<Select
									data={SEVERITIES}
									label="Severity"
									placeholder="Please select issue severity"
									leftSection={<Icon path={iconTarget} />}
									value={severity}
									onChange={setSeverity as any}
									maw={225}
									w="100%"
								/>
								<Spacer />
								<Button
									variant="gradient"
									rightSection={<Icon path={iconCursor} />}
									disabled={!canSubmit}
									onClick={submitTicket}
								>
									Submit Ticket
								</Button>
							</Group>
						</Stack>
					</Paper>

					<Grid gutter="xl">
						<Grid.Col span={{ base: 12, lg: 7 }}>
							<Paper
								p="xl"
								mt="xl"
							>
								<Group>
									<Icon
										path={iconHistory}
										size="xl"
									/>
									<Text
										fz="xl"
										fw={600}
										c="bright"
									>
										Ticket History
									</Text>
									<Spacer />
									<TextInput
										placeholder="Search tickets..."
										leftSection={<Icon path={iconSearch} />}
										// value={search}
										spellCheck={false}
										// onChange={setSearch}
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
											<Menu.Item>Pending</Menu.Item>
											<Menu.Item>Active</Menu.Item>
											<Menu.Item>Closed</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								</Group>
								<Divider my="md" />
								<Table>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>ID</Table.Th>
											<Table.Th>Date</Table.Th>
											<Table.Th>Type</Table.Th>
											<Table.Th w={96}>Status</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{pageSlice.map((ticket) => (
											<UnstyledButton
												key={ticket.id}
												component={Table.Tr}
												onClick={() => {
													navigate(`t/${ticket.id}`);
												}}
											>
												<Table.Td
													fw={500}
													fz="lg"
													c="bright"
												>
													#{ticket.id}
												</Table.Td>
												<Table.Td>{ticket.date}</Table.Td>
												<Table.Td>{ticket.type}</Table.Td>
												<Table.Td>
													<Badge
														variant="light"
														color={STATUS_COLORS[ticket.status]}
													>
														{ticket.status}
													</Badge>
												</Table.Td>
											</UnstyledButton>
										))}
									</Table.Tbody>
								</Table>
								<Group mt="md">
									<Pagination store={pagination} />
								</Group>
							</Paper>
						</Grid.Col>
						<Grid.Col span={{ base: 12, lg: 5 }}>
							<Paper
								p="xl"
								mt="xl"
							>
								<Group>
									<Icon
										path={iconHelp}
										size="xl"
									/>
									<Text
										fz="xl"
										fw={600}
										c="bright"
									>
										Frequently asked Questions
									</Text>
								</Group>
								<Divider my="md" />
								<Stack>
									<Accordion
										variant="filled"
										className={classes.faq}
									>
										<Accordion.Item value="password">
											<Accordion.Control>
												How do I reset my password?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													To reset your password, visit the login page and
													click the "Forgot password" link.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
										<Accordion.Item value="account">
											<Accordion.Control>
												How do I update my account information?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													To update your account information, visit the
													account settings page.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
										<Accordion.Item value="billing">
											<Accordion.Control>
												How do I update my billing information?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													To update your billing information, visit the
													billing settings page.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
										<Accordion.Item value="support">
											<Accordion.Control>
												How do I contact support?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													To contact support, submit a ticket from the
													support page.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
										<Accordion.Item value="time">
											<Accordion.Control>
												How long does it take to get a response?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													Our team typically responds to tickets within 24
													hours.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
										<Accordion.Item value="severity">
											<Accordion.Control>
												How do I set ticket severity?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													You can set ticket severity when submitting a
													ticket.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
										<Accordion.Item value="type">
											<Accordion.Control>
												How do I set ticket type?
											</Accordion.Control>
											<Accordion.Panel>
												<Text>
													You can set ticket type when submitting a
													ticket.
												</Text>
											</Accordion.Panel>
										</Accordion.Item>
									</Accordion>
								</Stack>
							</Paper>
						</Grid.Col>
					</Grid>
				</Box>
			</ScrollArea>
		</Box>
	);
}

export default TicketsPage;
