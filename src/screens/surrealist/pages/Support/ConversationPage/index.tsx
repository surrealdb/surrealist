import {
	Box,
	Button,
	Center,
	Divider,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { forwardRef, useEffect, useRef, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import {
	useConversationReplyMutation,
	useConversationStateMutation,
} from "~/cloud/mutations/context";
import { useCloudConversationQuery } from "~/cloud/queries/context";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useConfirmation } from "~/providers/Confirmation";
import { IntercomConversation } from "~/types";
import { formatRelativeDate, showErrorNotification } from "~/util/helpers";
import {
	iconArrowLeft,
	iconBullhorn,
	iconChat,
	iconClock,
	iconClose,
	iconSurreal,
} from "~/util/icons";
import { ConversationPart } from "../ConversationPart";
import classes from "../style.module.scss";

export interface ReplyBoxProps {
	conversation: IntercomConversation;
	onClose: () => void;
	recomputeHeight: () => void;
}

export const ReplyBox = forwardRef<HTMLDivElement, ReplyBoxProps>(
	({ conversation, onClose, recomputeHeight }, ref) => {
		const replyMutation = useConversationReplyMutation(conversation.id);
		const [body, setBody] = useInputState("");

		return (
			<Paper
				p="lg"
				pos="absolute"
				bottom={0}
				left={0}
				right={0}
				mx="auto"
				maw={900}
				ref={ref}
			>
				<Stack gap="xl">
					<Group>
						<Text
							fz="lg"
							fw={700}
						>
							Reply to conversation
						</Text>
						<Spacer />
						<ActionButton
							size="lg"
							label="Attach file"
							c="white"
							onClick={onClose}
						>
							<Icon
								size="md"
								path={iconClose}
							/>
						</ActionButton>
					</Group>
					<Textarea
						placeholder="Reply to ticket"
						minRows={4}
						autosize
						value={body}
						onChange={(event) => {
							setBody(event.target.value);
							recomputeHeight();
						}}
					/>
					<Group>
						<Spacer />
						<Button
							variant="gradient"
							disabled={!body}
							loading={replyMutation.isPending}
							onClick={async () => {
								const result = await replyMutation.mutateAsync({
									body: body,
								});

								if (!result) {
									showErrorNotification({
										title: "Failed to send reply",
										content: "Please try again later.",
									});
								}

								onClose();
								setBody("");
							}}
						>
							Send
						</Button>
					</Group>
				</Stack>
			</Paper>
		);
	},
);

interface TicketDataProps {
	title: string;
	subtitle: string;
	color: string;
	icon: string;
}

function TicketData({ title, subtitle, color, icon }: TicketDataProps) {
	return (
		<Group gap="lg">
			<ThemeIcon
				size={40}
				variant="light"
				color={color}
			>
				<Icon path={icon} />
			</ThemeIcon>
			<Stack gap={0}>
				<Text>{title}</Text>
				<Text
					c="bright"
					fz="lg"
				>
					{subtitle}
				</Text>
			</Stack>
		</Group>
	);
}

export interface ConversationPageProps {
	id: string;
}

export function ConversationPage({ id }: ConversationPageProps) {
	const htmlRegex = /(<([^>]+)>)/gi;
	const { data: conversation, isLoading } = useCloudConversationQuery(id);

	const conversationStateMutation = useConversationStateMutation();

	const title = conversation?.title.replace(htmlRegex, "");

	const [random, setRandom] = useState(0);
	const [replyBoxHeight, setReplyBoxHeight] = useState(0);
	const [replyBoxOpen, replyBoxHandle] = useBoolean(false);
	const replyBoxRef = useRef<HTMLDivElement>(null);

	const close = useConfirmation({
		title: "Close conversation",
		message: `Are you sure you want to close this conversation? You can re-open it later.`,
		confirmText: "Close ticket",
		confirmProps: {
			loading: conversationStateMutation.isPending,
		},
		onConfirm: async () => {
			// const result = await ticketCloseMutation.mutateAsync();
			// if (!result || result.open) {
			// 	showErrorNotification({
			// 		title: "Failed to close conversation",
			// 		content: "Please try again later.",
			// 	});
			// }
		},
	});

	// useEffect(() => {
	// 	setReplyBoxHeight(replyBoxRef.current?.getBoundingClientRect().height ?? 0);
	// }, [replyBoxOpen, random, replyBoxRef.current]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only trigger if the conversation changes
	useEffect(() => {
		if (conversation) {
			conversationStateMutation.mutateAsync({
				conversationId: conversation.id,
				state: "read",
			});
		}
	}, [conversation]);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			{isLoading && (
				<Center
					w="100%"
					h="100%"
					flex={1}
				>
					<Loader />
				</Center>
			)}

			{!isLoading && !conversation && (
				<Center
					w="100%"
					h="100%"
					flex={1}
				>
					<Stack
						gap={0}
						align="center"
					>
						<PrimaryTitle>Conversation not found</PrimaryTitle>
						<Text>The conversation you are looking for does not exist</Text>
						<Button
							mt="xl"
							size="sm"
							variant="gradient"
							leftSection={<Icon path={iconArrowLeft} />}
							onClick={() => navigate("/support")}
						>
							Back to Support
						</Button>
					</Stack>
				</Center>
			)}

			{!isLoading && conversation && (
				<>
					<ScrollArea
						pos="absolute"
						scrollbars="y"
						type="scroll"
						inset={0}
						className={classes.scrollArea}
						mt={18}
					>
						<Stack
							px="xl"
							mx="auto"
							maw={1200}
							pb={68}
						>
							<Box>
								<PageBreadcrumbs
									items={[
										{ label: "Surrealist", href: "/overview" },
										{ label: "Support", href: "/support" },
										{ label: "Requests", href: "/support/requests" },
										{ label: title ?? "Unnamed Conversation" },
									]}
								/>
								<Group mt="sm">
									<Stack gap={0}>
										<PrimaryTitle fz={32}>
											{title ?? "Unnamed Conversation"}
										</PrimaryTitle>
									</Stack>

									<Spacer />

									<Button
										color="slate"
										variant="light"
										leftSection={<Icon path={iconArrowLeft} />}
										onClick={() => navigate(`/support/requests`)}
									>
										All requests
									</Button>
								</Group>
							</Box>

							{conversation.hasTicket && (
								<Stack
									gap="md"
									mb="lg"
									style={{
										userSelect: "text",
									}}
								>
									<Group
										gap="lg"
										align="start"
										wrap="nowrap"
										w="100%"
									>
										<ConversationPart
											conversation={conversation}
											part={conversation.initial_part}
											initial
										/>

										<Paper
											p="lg"
											bg="slate.7"
											w="25rem"
										>
											<Stack>
												<TicketData
													title="State"
													subtitle={
														conversation.ticketData?.state.label ??
														"Unknown"
													}
													color="blue"
													icon={iconChat}
												/>
												<Divider />
												<TicketData
													title="Type"
													subtitle={
														conversation.ticketData?.type.name ??
														"Unknown"
													}
													color="violet"
													icon={iconBullhorn}
												/>
												{conversation.assignee && (
													<TicketData
														title="Assignee"
														subtitle={conversation.assignee.name}
														color="surreal"
														icon={iconSurreal}
													/>
												)}
												<TicketData
													title="Last updated"
													subtitle={formatRelativeDate(
														conversation.updated_at * 1000,
													)}
													color="green"
													icon={iconClock}
												/>
											</Stack>
										</Paper>
									</Group>
									<PrimaryTitle mt="lg">
										{conversation.parts.length} Updates
									</PrimaryTitle>
									<Divider />
								</Stack>
							)}

							<Stack
								gap="lg"
								style={{
									userSelect: "text",
								}}
							>
								{!conversation.hasTicket && (
									<ConversationPart
										conversation={conversation}
										part={conversation.initial_part}
									/>
								)}
								{conversation.parts.map((part) => (
									<ConversationPart
										key={part.id}
										conversation={conversation}
										part={part}
									/>
								))}
							</Stack>
						</Stack>
					</ScrollArea>

					{replyBoxOpen && (
						<ReplyBox
							ref={replyBoxRef}
							conversation={conversation}
							onClose={replyBoxHandle.close}
							recomputeHeight={() => setRandom(random + 1)}
						/>
					)}
				</>
			)}
		</Box>
	);
}
