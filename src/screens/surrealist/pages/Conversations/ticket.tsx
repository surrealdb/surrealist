// import {
// 	Avatar,
// 	Box,
// 	Button,
// 	Divider,
// 	Group,
// 	Paper,
// 	ScrollArea,
// 	Skeleton,
// 	Space,
// 	Stack,
// 	Text,
// 	Textarea,
// 	ThemeIcon,
// 	UnstyledButton,
// } from "@mantine/core";
// import { useInputState } from "@mantine/hooks";
// import { forwardRef, useEffect, useRef, useState } from "react";
// import { useLocation } from "wouter";
// import { useTicketCloseMutation, useTicketReplyMutation } from "~/cloud/mutations/tickets";
// import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
// import { useCloudTicketQuery } from "~/cloud/queries/tickets";
// import { ActionButton } from "~/components/ActionButton";
// import { CloudAdminGuard } from "~/components/CloudAdminGuard";
// import { Icon } from "~/components/Icon";
// import { Label } from "~/components/Label";
// import { PrimaryTitle } from "~/components/PrimaryTitle";
// import { Spacer } from "~/components/Spacer";
// import { TICKET_STATES } from "~/constants";
// import { useBoolean } from "~/hooks/boolean";
// import { useConfirmation } from "~/providers/Confirmation";
// import { CloudOrganization, CloudTicket } from "~/types";
// import { formatRelativeDate, plural, showErrorNotification } from "~/util/helpers";
// import {
// 	iconAccount,
// 	iconArrowLeft,
// 	iconBullhorn,
// 	iconChat,
// 	iconClose,
// 	iconCursor,
// 	iconSurreal,
// } from "~/util/icons";
// import classes from "./style.module.scss";
// import { TicketPart } from "./TicketPart";

// export interface TicketPageProps {
// 	id: string;
// 	organization: string;
// }

// export interface TicketReplyBoxProps {
// 	ticket?: CloudTicket;
// 	organization: string;
// 	onClose: () => void;
// 	recomputeHeight: () => void;
// }

// export const TicketReplyBox = forwardRef<HTMLDivElement, TicketReplyBoxProps>(
// 	({ ticket, organization, onClose, recomputeHeight }, ref) => {
// 		const replyMutation = useTicketReplyMutation(organization, ticket?.id);
// 		const [body, setBody] = useInputState("");

// 		return (
// 			<Paper
// 				p="lg"
// 				pos="absolute"
// 				bottom={0}
// 				left={0}
// 				right={0}
// 				mx="auto"
// 				maw={900}
// 				ref={ref}
// 			>
// 				<Stack gap="xl">
// 					<Group>
// 						<Text
// 							fz="lg"
// 							fw={700}
// 						>
// 							Reply to ticket
// 						</Text>
// 						<Spacer />
// 						<ActionButton
// 							size="lg"
// 							label="Attach file"
// 							c="white"
// 							onClick={onClose}
// 						>
// 							<Icon
// 								size="md"
// 								path={iconClose}
// 							/>
// 						</ActionButton>
// 					</Group>
// 					<Textarea
// 						placeholder="Reply to ticket"
// 						minRows={4}
// 						autosize
// 						value={body}
// 						onChange={(event) => {
// 							setBody(event.target.value);
// 							recomputeHeight();
// 						}}
// 					/>
// 					<Group>
// 						<Spacer />
// 						<Button
// 							variant="gradient"
// 							disabled={!body}
// 							loading={replyMutation.isPending}
// 							onClick={async () => {
// 								const result = await replyMutation.mutateAsync({
// 									body: body,
// 								});

// 								if (!result) {
// 									showErrorNotification({
// 										title: "Failed to send reply",
// 										content: "Please try again later.",
// 									});
// 								}

// 								onClose();
// 								setBody("");
// 							}}
// 						>
// 							Send
// 						</Button>
// 					</Group>
// 				</Stack>
// 			</Paper>
// 		);
// 	},
// );

// export function TicketPage({ id, organization: orgId }: TicketPageProps) {
// 	const [, navigate] = useLocation();

// 	const [random, setRandom] = useState(0);
// 	const [replyBoxHeight, setReplyBoxHeight] = useState(0);
// 	const [replyBoxOpen, replyBoxHandle] = useBoolean(false);
// 	const replyBoxRef = useRef<HTMLDivElement>(null);
// 	const ticketCloseMutation = useTicketCloseMutation(orgId, id);

// 	const close = useConfirmation({
// 		title: "Close ticket",
// 		message: `Are you sure you want to close this ticket? Once closed, you will not be able to re-open it.`,
// 		confirmText: "Close ticket",
// 		confirmProps: {
// 			loading: ticketCloseMutation.isPending,
// 		},
// 		onConfirm: async () => {
// 			const result = await ticketCloseMutation.mutateAsync();

// 			if (!result || result.open) {
// 				showErrorNotification({
// 					title: "Failed to close ticket",
// 					content: "Please try again later.",
// 				});
// 			}
// 		},
// 	});

// 	useEffect(() => {
// 		setReplyBoxHeight(replyBoxRef.current?.getBoundingClientRect().height ?? 0);
// 	}, []);

// 	const { data: organisation } = useCloudOrganizationQuery(orgId);
// 	const { data: ticket, isPending: ticketPending } = useCloudTicketQuery(orgId, id);

// 	console.log(organisation);

// 	return (
// 		<CloudAdminGuard organisation={organisation as CloudOrganization}>
// 			<Box
// 				flex={1}
// 				pos="relative"
// 			>
// 				<ScrollArea
// 					pos="absolute"
// 					scrollbars="y"
// 					type="scroll"
// 					inset={0}
// 					className={classes.scrollArea}
// 				>
// 					<Box
// 						mx="auto"
// 						maw={900}
// 						pb={96}
// 					>
// 						<Group wrap="nowrap">
// 							<PrimaryTitle>Ticket #{ticket?.id}</PrimaryTitle>
// 							<Spacer />
// 							<Button
// 								variant="light"
// 								color="slate"
// 								leftSection={<Icon path={iconArrowLeft} />}
// 								onClick={() => navigate(`/tickets/${orgId}`)}
// 								size="xs"
// 							>
// 								Back to overview
// 							</Button>
// 						</Group>
// 						<Group
// 							mt="md"
// 							wrap="nowrap"
// 							align="start"
// 						>
// 							<Skeleton
// 								visible={ticketPending}
// 								flex={1}
// 							>
// 								<Paper p="lg">
// 									<Group
// 										gap="xl"
// 										wrap="nowrap"
// 										align="start"
// 									>
// 										<Avatar
// 											radius="md"
// 											size={36}
// 											name={ticket?.contacts[0]?.name}
// 											src={ticket?.contacts[0]?.avatar}
// 											component={UnstyledButton}
// 											style={{
// 												cursor: "default",
// 											}}
// 										></Avatar>

// 										<Stack>
// 											<Stack gap={0}>
// 												<Text
// 													c="bright"
// 													fz="lg"
// 													fw={700}
// 												>
// 													{ticket?.contacts[0]?.name}
// 												</Text>
// 												<Text
// 													fz="sm"
// 													c="slate.3"
// 												>
// 													{formatRelativeDate(
// 														(ticket?.updated_at ?? 0) * 1000,
// 													)}
// 												</Text>
// 											</Stack>
// 											<p>{ticket?.description}</p>
// 										</Stack>
// 									</Group>
// 								</Paper>
// 							</Skeleton>
// 							<Skeleton
// 								visible={ticketPending}
// 								flex={1}
// 								maw={225}
// 							>
// 								<Paper p="lg">
// 									<Stack gap="lg">
// 										<Group>
// 											<ThemeIcon
// 												size="lg"
// 												variant="light"
// 												color={
// 													TICKET_STATES[
// 														ticket?.state.category ?? "submitted"
// 													].color
// 												}
// 											>
// 												<Icon path={iconChat} />
// 											</ThemeIcon>
// 											<Box>
// 												<Label
// 													mb={0}
// 													fz="xs"
// 													c="slate.3"
// 												>
// 													State
// 												</Label>
// 												<Text c="bright">
// 													{
// 														TICKET_STATES[
// 															ticket?.state.category ?? "submitted"
// 														].label
// 													}
// 												</Text>
// 											</Box>
// 										</Group>
// 										<Divider />
// 										<Group>
// 											<ThemeIcon
// 												size="lg"
// 												variant="light"
// 												color="violet"
// 											>
// 												<Icon path={iconBullhorn} />
// 											</ThemeIcon>
// 											<Box>
// 												<Label
// 													mb={0}
// 													fz="xs"
// 													c="slate.3"
// 												>
// 													Type
// 												</Label>
// 												<Text c="bright">{ticket?.type.name}</Text>
// 											</Box>
// 										</Group>
// 										<Group wrap="nowrap">
// 											<ThemeIcon
// 												size="lg"
// 												variant="light"
// 												color="green"
// 											>
// 												<Icon path={iconAccount} />
// 											</ThemeIcon>
// 											<Box miw={0}>
// 												<Label
// 													mb={0}
// 													fz="xs"
// 													c="slate.3"
// 												>
// 													Contacts
// 												</Label>
// 												<Text
// 													c="bright"
// 													truncate
// 												>
// 													{ticket?.contacts
// 														.map((contact) => contact.name)
// 														.join(", ")}
// 												</Text>
// 											</Box>
// 										</Group>
// 										{ticket?.assignee && (
// 											<Group wrap="nowrap">
// 												<ThemeIcon
// 													size="lg"
// 													variant="light"
// 													color="surreal"
// 												>
// 													<Icon path={iconSurreal} />
// 												</ThemeIcon>
// 												<Box miw={0}>
// 													<Label
// 														mb={0}
// 														fz="xs"
// 														c="slate.3"
// 													>
// 														Assigned to
// 													</Label>
// 													<Text
// 														c="bright"
// 														truncate
// 													>
// 														{ticket?.assignee?.name}
// 													</Text>
// 												</Box>
// 											</Group>
// 										)}
// 									</Stack>
// 								</Paper>
// 							</Skeleton>
// 						</Group>

// 						<Skeleton
// 							visible={ticketPending}
// 							mt="xl"
// 						>
// 							<PrimaryTitle mt="xl">
// 								{ticket?.parts.length}{" "}
// 								{plural(ticket?.parts.length ?? 0, "Update", "Updates")}
// 							</PrimaryTitle>

// 							<Divider mt="xs" />

// 							<Stack
// 								w="100%"
// 								mt="xl"
// 								gap="xl"
// 							>
// 								{ticket?.parts.map((part) => (
// 									<TicketPart
// 										key={part.id}
// 										part={part}
// 									/>
// 								))}
// 							</Stack>

// 							{!ticket?.open && (
// 								<Text
// 									ta="center"
// 									fz="lg"
// 									mt={40}
// 								>
// 									This ticket was closed. Please create a new ticket if you still
// 									need help.
// 								</Text>
// 							)}

// 							{ticket?.open && !replyBoxOpen && (
// 								<Group
// 									mt="xl"
// 									justify="center"
// 								>
// 									<Button
// 										variant="gradient"
// 										rightSection={<Icon path={iconCursor} />}
// 										onClick={replyBoxHandle.open}
// 									>
// 										Send a reply
// 									</Button>
// 									<Button
// 										variant="light"
// 										color="slate"
// 										rightSection={<Icon path={iconClose} />}
// 										onClick={close}
// 									>
// 										Close ticket
// 									</Button>
// 								</Group>
// 							)}
// 						</Skeleton>
// 					</Box>
// 					<Space h={replyBoxHeight} />
// 				</ScrollArea>
// 				{replyBoxOpen && (
// 					<TicketReplyBox
// 						ref={replyBoxRef}
// 						organization={orgId}
// 						ticket={ticket}
// 						onClose={replyBoxHandle.close}
// 						recomputeHeight={() => setRandom(random + 1)}
// 					/>
// 				)}
// 			</Box>
// 		</CloudAdminGuard>
// 	);
// }

// export default TicketPage;
