import {
	Badge,
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
import { closeModal, openModal } from "@mantine/modals";
import {
	Icon,
	iconArrowLeft,
	iconBullhorn,
	iconChat,
	iconCheck,
	iconClock,
	iconFile,
	iconPause,
	iconPlus,
	iconRefresh,
} from "@surrealdb/ui";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import {
	useConversationReopenMutation,
	useConversationReplyMutation,
	useConversationStateMutation,
} from "~/cloud/mutations/context";
import { useCloudConversationQuery } from "~/cloud/queries/context";
import { AccountAvatar } from "~/components/AccountAvatar";
import { ActionButton } from "~/components/ActionButton";
import { AuthGuard } from "~/components/AuthGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useCloudProfile } from "~/hooks/cloud";
import { fileToBase64 } from "~/util/file";
import { formatRelativeDate, showErrorNotification } from "~/util/helpers";
import { ConversationPart } from "../ConversationPart";
import classes from "../style.module.scss";

const SUPPORT_STATES = [
	{
		label: "Resolved",
		value: "resolved",
		icon: iconCheck,
		color: "green",
	},
	{
		label: "Submitted",
		value: "submitted",
		icon: iconChat,
		color: "blue",
	},
	{
		label: "In progress",
		value: "in_progress",
		icon: iconRefresh,
		color: "blue",
	},
	{
		label: "Waiting on you",
		value: "waiting_on_customer",
		icon: iconPause,
		color: "orange",
	},
];

const openReopenTicketModal = (id: string) => {
	openModal({
		withCloseButton: true,
		modalId: "reopen-ticket",
		title: <PrimaryTitle fz={18}>Reopen conversation</PrimaryTitle>,
		children: <ReopenModalContent id={id} />,
	});
};

function ReopenModalContent({ id }: { id: string }) {
	const [message, setMessage] = useInputState("");

	const reopenMutation = useConversationReopenMutation(id);

	return (
		<Stack gap="xl">
			<Textarea
				placeholder="Please describe the reason for reopening the conversation"
				minRows={4}
				value={message}
				onChange={setMessage}
				autosize
			/>
			<Group>
				<Spacer />
				<Button
					disabled={!message}
					size="xs"
					variant="gradient"
					loading={reopenMutation.isPending}
					onClick={async () => {
						await reopenMutation.mutateAsync(message);
						closeModal("reopen-ticket");
					}}
				>
					Reopen
				</Button>
			</Group>
		</Stack>
	);
}

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

interface ConversationAttributeProps {
	name: string;
	value: any;
}

function ConversationAttribute({ value }: ConversationAttributeProps) {
	const formatAttributeValue = (val: any): React.ReactNode => {
		if (val === null || val === undefined) {
			return (
				<Text
					c="slate.4"
					fs="italic"
				>
					No value
				</Text>
			);
		}

		// Handle arrays
		if (Array.isArray(val)) {
			if (val.length === 0) {
				return (
					<Text
						c="slate.4"
						fs="italic"
					>
						No items
					</Text>
				);
			}

			if (val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
				return (
					<Group gap="xs">
						{val.map((item, index) => {
							return <div key={index}>{formatAttributeValue(item)}</div>;
						})}
					</Group>
				);
			}

			return (
				<Group gap="xs">
					{val.map((item, index) => (
						<Badge
							key={index}
							variant="light"
							color="blue"
						>
							{String(item)}
						</Badge>
					))}
				</Group>
			);
		}

		if (typeof val === "object" && val !== null) {
			if (val.content_type) {
				return (
					<Text
						c="surreal"
						style={{ cursor: "pointer" }}
						onClick={() => adapter.openUrl(val.url)}
					>
						{val.name}
					</Text>
				);
			}

			if (val.value !== undefined) {
				return <Text>{String(val.value)}</Text>;
			}

			return (
				<Text
					component="pre"
					style={{
						whiteSpace: "pre-wrap",
						fontSize: "0.875rem",
						backgroundColor: "var(--mantine-color-slate-8)",
						padding: "0.5rem",
						borderRadius: "0.25rem",
						fontFamily: "monospace",
					}}
				>
					{JSON.stringify(val, null, 2)}
				</Text>
			);
		}

		if (typeof val === "boolean") {
			return <Text>{val ? "Yes" : "No"}</Text>;
		}

		if (typeof val === "number") {
			if (val > 1000000000 && val < 2000000000) {
				return <Text>{new Date(val * 1000).toLocaleString()}</Text>;
			}

			return <Text>{val.toLocaleString()}</Text>;
		}

		if (typeof val === "string") {
			if (val.startsWith("http://") || val.startsWith("https://")) {
				return (
					<Text
						rel="noopener noreferrer"
						c="surreal"
						style={{ textDecoration: "underline", cursor: "pointer" }}
						onClick={() => adapter.openUrl(val)}
					>
						{val}
					</Text>
				);
			}

			if (val.includes("@") && val.includes(".")) {
				return (
					<Text
						component="a"
						href={`mailto:${val}`}
						c="surreal"
						style={{ textDecoration: "underline" }}
					>
						{val}
					</Text>
				);
			}

			if (val.length > 100) {
				return (
					<Text
						style={{
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
						}}
					>
						{val}
					</Text>
				);
			}

			return <Text>{val}</Text>;
		}

		return <Text>{String(val)}</Text>;
	};

	return <Box>{formatAttributeValue(value)}</Box>;
}

export interface ConversationPageProps {
	id: string;
}

export function ConversationPage({ id }: ConversationPageProps) {
	const htmlRegex = /(<([^>]+)>)/gi;
	const profile = useCloudProfile();
	const { data: conversation, isLoading } = useCloudConversationQuery(id);

	const conversationStateMutation = useConversationStateMutation();
	const replyMutation = useConversationReplyMutation(id);

	const title = conversation?.title.replace(htmlRegex, "") || `Conversation #${id}`;

	const [replyBody, setReplyBody] = useInputState("");
	const [attachedFiles, setAttachedFiles] = useInputState<File[]>([]);

	const isClosed = conversation?.state === "closed" || !conversation?.open;

	const state = SUPPORT_STATES.find(
		(state) => state.value === conversation?.ticketData?.state.category,
	);

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
		fileInput.accept =
			"image/*,application/pdf,text/csv,text/plain,application/json,.yaml,.toml,.sh,.sql,.surql,.surrealql,.surql,.tar,.zip";
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
		<AuthGuard>
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
							maw={1000}
							pb={68}
						>
							<Box>
								<PageBreadcrumbs
									items={[
										{ label: "Surrealist", href: "/overview" },
										{ label: "Support", href: "/support" },
										{ label: "Requests", href: "/support/requests" },
										{ label: title ?? "Unnamed" },
									]}
								/>
								<Group mt="sm">
									<Group>
										<PrimaryTitle fz={32}>{title ?? "Unnamed"}</PrimaryTitle>
									</Group>

									<Spacer />

									<Button
										color="slate"
										variant="light"
										leftSection={<Icon path={iconArrowLeft} />}
										onClick={() => navigate(`/support/requests`)}
									>
										All tickets
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
										<Paper
											p="lg"
											w="100%"
										>
											<Stack>
												<PrimaryTitle
													fz="lg"
													fw={600}
												>
													Description
												</PrimaryTitle>
												<div
													className={classes.intercomContainer}
													// biome-ignore lint/security/noDangerouslySetInnerHtml: Required since Intercom returns HTML
													dangerouslySetInnerHTML={{
														__html:
															conversation.initial_part.body ?? "",
													}}
												/>
											</Stack>

											{Object.entries(
												conversation.ticketData?.attributes ?? {},
											)
												.filter(([name, value]) => {
													const irrelevantNames = ["Organisation"];

													if (
														irrelevantNames.some((irrelevant) =>
															name
																.toLowerCase()
																.includes(irrelevant.toLowerCase()),
														)
													) {
														return false;
													}

													if (value === null || value === undefined) {
														return false;
													}

													if (
														typeof value === "string" &&
														value.trim() === ""
													) {
														return false;
													}

													if (
														Array.isArray(value) &&
														value.length === 0
													) {
														return false;
													}

													if (
														typeof value === "object" &&
														value !== null &&
														Object.keys(value).length === 0
													) {
														return false;
													}

													return true;
												})
												.map(([name, value]) => (
													<Stack
														mt="lg"
														key={name}
														gap="xs"
													>
														<PrimaryTitle
															fz="lg"
															fw={600}
														>
															{name}
														</PrimaryTitle>
														<ConversationAttribute
															name={name}
															value={value}
														/>
													</Stack>
												))}
										</Paper>

										<Paper
											p="lg"
											w="25rem"
										>
											<Stack>
												<TicketData
													title="State"
													subtitle={
														state?.label ??
														conversation.ticketData?.state.label ??
														"Unknown"
													}
													color={state?.color ?? "white"}
													icon={state?.icon ?? iconChat}
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
												<TicketData
													title="Last updated"
													subtitle={formatRelativeDate(
														conversation.updated_at * 1000,
													)}
													color="violet"
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

								{!isClosed && (
									<Paper p="lg">
										<Stack gap="xl">
											<Group>
												<AccountAvatar />
												<Text
													fz="lg"
													fw={700}
													c="bright"
												>
													{profile.name}
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
												spellCheck={true}
												placeholder="Reply to this conversation"
												minRows={4}
												autosize
												value={replyBody}
												onChange={setReplyBody}
											/>
											<Group>
												<ActionButton
													label="Add attachments"
													variant="light"
													onClick={() => {
														attachFile();
													}}
												>
													<Icon path={iconPlus} />
												</ActionButton>
												<Spacer />
												<Button
													variant="gradient"
													disabled={
														attachedFiles.length === 0 && !replyBody
													}
													loading={replyMutation.isPending}
													onClick={async () => {
														await sendReply();
													}}
												>
													Submit
												</Button>
											</Group>
										</Stack>
									</Paper>
								)}

								{isClosed && (
									<Stack
										align="center"
										mt="xl"
									>
										<Divider
											w="100%"
											mb="md"
										/>
										<Text fz="lg">
											You cannot reply to this thread since the conversation
											was closed
										</Text>
										<Button
											variant="gradient"
											onClick={() => {
												openReopenTicketModal(conversation.id);
											}}
										>
											Reopen conversation
										</Button>
									</Stack>
								)}
							</Stack>
						</Stack>
					</ScrollArea>
				)}
			</Box>
		</AuthGuard>
	);
}
