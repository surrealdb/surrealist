import {
	Box,
	Button,
	Center,
	Divider,
	Group,
	Loader,
	Paper,
	Pill,
	PillGroup,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import {
	useConversationReplyMutation,
	useConversationStateMutation,
} from "~/cloud/mutations/context";
import { useCloudConversationQuery } from "~/cloud/queries/context";
import { AccountAvatar } from "~/components/AccountAvatar";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { fileToBase64 } from "~/util/file";
import { formatRelativeDate, showErrorNotification } from "~/util/helpers";
import {
	iconArrowLeft,
	iconBullhorn,
	iconChat,
	iconClock,
	iconFile,
	iconPlus,
	iconSurreal,
} from "~/util/icons";
import { ConversationPart } from "../ConversationPart";
import classes from "../style.module.scss";

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
	const replyMutation = useConversationReplyMutation(id);

	const title = conversation?.title.replace(htmlRegex, "");

	const [replyBody, setReplyBody] = useInputState("");
	const [attachedFiles, setAttachedFiles] = useInputState<File[]>([]);

	const sendReply = async () => {
		const attachment_files = await Promise.all(
			attachedFiles.map(async (file) => {
				const base64 = await fileToBase64(file);

				return {
					content_type: file.type,
					data: base64,
					name: file.name,
				};
			}),
		);

		const result = await replyMutation.mutateAsync({
			body: replyBody,
			attachment_files,
		});

		if (!result) {
			showErrorNotification({
				title: "Failed to send reply",
				content: "Please try again later.",
			});
		}

		setReplyBody("");
		setAttachedFiles([]);
	};

	const attachFile = () => {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*,application/pdf";
		fileInput.multiple = true;
		fileInput.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			setAttachedFiles([...attachedFiles, ...(target.files ?? [])]);
		};
		fileInput.click();
	};

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
													conversation.ticketData?.type.name ?? "Unknown"
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

							<Paper p="lg">
								<Stack gap="xl">
									<Group>
										<AccountAvatar />
										<Text
											fz="lg"
											fw={700}
											c="bright"
										>
											Add a comment
										</Text>
									</Group>
									<PillGroup>
										{attachedFiles.map((file) => (
											<Pill
												key={file.name}
												withRemoveButton
												onRemove={() =>
													setAttachedFiles(
														attachedFiles.filter(
															(f) => f.name !== file.name,
														),
													)
												}
											>
												<Icon
													size="sm"
													mr={4}
													path={iconFile}
												/>
												{file.name}
											</Pill>
										))}
									</PillGroup>
									<Textarea
										placeholder="Reply to this conversation"
										minRows={4}
										autosize
										value={replyBody}
										onChange={setReplyBody}
									/>
									<Group>
										<ActionButton
											label="Send an attachment"
											variant="light"
											onClick={() => {
												attachFile();
											}}
										>
											<Icon path={iconPlus} />
										</ActionButton>
										<Spacer />
										<Button
											variant="light"
											color="violet"
										>
											{attachedFiles.length === 0 && !replyBody
												? "Close conversation"
												: "Close with comment"}
										</Button>
										<Button
											variant="gradient"
											disabled={attachedFiles.length === 0 && !replyBody}
											loading={replyMutation.isPending}
											onClick={async () => {
												await sendReply();
											}}
										>
											Send comment
										</Button>
									</Group>
								</Stack>
							</Paper>
						</Stack>
					</Stack>
				</ScrollArea>
			)}
		</Box>
	);
}
