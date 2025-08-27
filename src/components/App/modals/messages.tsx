/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: Intercom returns raw HTML */
import {
	Box,
	Divider,
	Drawer,
	Group,
	Indicator,
	Loader,
	Menu,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Transition,
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Fragment, useState } from "react";
import { useConversationStateMutation } from "~/cloud/mutations/context";
import { useConversationsQuery } from "~/cloud/queries/context";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { ConversationPart } from "~/screens/surrealist/pages/Conversations/ConversationPart";
import { IntercomConversation } from "~/types";
import { formatRelativeDate } from "~/util/helpers";
import {
	iconChat,
	iconClose,
	iconDotsVertical,
	iconEye,
	iconEyeOff,
	iconOrganization,
	iconPlus,
	iconTag,
} from "~/util/icons";
import classes from "../style.module.scss";

export function MessagesDrawer() {
	const htmlRegex = /(<([^>]+)>)/gi;
	const [isOpen, openHandle] = useDisclosure();
	const [isReading, readingHandle] = useDisclosure();
	const [reading, setReading] = useState<IntercomConversation | null>(null);

	const conversationsQuery = useConversationsQuery();
	const { mutate: updateConversationState } = useConversationStateMutation();

	const openMessage = (item: IntercomConversation) => {
		setReading(item);
		readingHandle.open();

		updateConversationState({
			conversationId: item.id,
			state: "read",
		});
	};

	const handleClose = useStable(() => {
		openHandle.close();
		readingHandle.close();
	});

	useIntent("open-messages", ({ id }) => {
		openHandle.open();

		const conversation = conversationsQuery.data?.find((item) => item.id === id);

		if (conversation) {
			openMessage(conversation);
		}
	});

	const isEmpty = conversationsQuery.isFetched && conversationsQuery.data?.length === 0;

	return (
		<Drawer
			opened={isOpen}
			onClose={handleClose}
			position="right"
			trapFocus={false}
			size={isReading ? "lg" : "md"}
			classNames={{
				content: classes.newsDrawerContent,
				body: classes.newsDrawerBody,
			}}
		>
			<Transition
				mounted={isReading}
				transition="fade"
			>
				{(styles) => (
					<Box
						pos="absolute"
						style={styles}
						inset={0}
					>
						{reading && (
							<ScrollArea
								className={classes.messagesScroll}
								pos="absolute"
								style={{ width: "var(--drawer-size-lg)" }}
								left={0}
								bottom={0}
								top={0}
							>
								<Box
									p="xl"
									pt={20}
								>
									<Group>
										<Title
											fz="h1"
											c="bright"
											pos="relative"
										>
											{reading.title.replace(htmlRegex, "")}
										</Title>

										<Spacer />

										<Menu>
											<Menu.Target>
												<ActionButton
													size="lg"
													label="Actions"
												>
													<Icon path={iconDotsVertical} />
												</ActionButton>
											</Menu.Target>
											<Menu.Dropdown>
												<Menu.Item
													leftSection={<Icon path={iconOrganization} />}
												>
													Show members
												</Menu.Item>
												{!reading.read && (
													<Menu.Item
														onClick={() => {
															updateConversationState({
																conversationId: reading.id,
																state: "read",
															});
														}}
														leftSection={
															<Icon
																path={
																	reading.read
																		? iconEyeOff
																		: iconEye
																}
															/>
														}
													>
														Mark as read
													</Menu.Item>
												)}
												<Menu.Divider />
												<Menu.Item
													leftSection={
														<Icon
															c="red"
															path={iconClose}
														/>
													}
													c="red"
												>
													Mark as closed
												</Menu.Item>
											</Menu.Dropdown>
										</Menu>

										<ActionButton
											size="lg"
											label="All messages"
											onClick={readingHandle.close}
										>
											<Icon path={iconClose} />
										</ActionButton>
									</Group>
									<Text fz="lg">
										Last updated {formatRelativeDate(reading.updated_at * 1000)}
									</Text>
									<Divider my="xl" />
									<Stack gap="md">
										{reading.initial_part && (
											<ConversationPart
												conversation={reading}
												part={reading.initial_part}
											/>
										)}
										{reading.parts.map((part) => (
											<ConversationPart
												key={part.id}
												conversation={reading}
												part={part}
											/>
										))}
									</Stack>
								</Box>
							</ScrollArea>
						)}
					</Box>
				)}
			</Transition>

			<Transition
				mounted={!isReading}
				transition="fade"
			>
				{(styles) => (
					<Box
						pos="absolute"
						style={styles}
						inset={0}
					>
						<Group
							gap="md"
							p="xl"
						>
							<Title
								fz={20}
								c="bright"
							>
								Messages
							</Title>
							<Spacer />
							<ActionButton
								variant="light"
								label="Create new"
							>
								<Icon path={iconPlus} />
							</ActionButton>
							<ActionButton
								variant="light"
								label="Close"
								onClick={handleClose}
							>
								<Icon path={iconClose} />
							</ActionButton>
						</Group>
						<ScrollArea
							pos="absolute"
							style={{ width: "var(--drawer-size-md)" }}
							left={0}
							bottom={0}
							top={64}
							p="lg"
						>
							{conversationsQuery.isPending ? (
								<Loader
									mt={32}
									mx="auto"
									display="block"
								/>
							) : isEmpty ? (
								<Text
									mt={68}
									c="slate"
									ta="center"
								>
									No messages found
								</Text>
							) : (
								<Stack gap={5}>
									{conversationsQuery.data?.map((item, i) => (
										<Fragment key={i}>
											<UnstyledButton
												p="sm"
												onClick={() => openMessage(item)}
												className={classes.messageItem}
											>
												<Group gap="md">
													{item.hasTicket && (
														<ThemeIcon
															size={40}
															variant="light"
															color="surreal"
														>
															<Icon path={iconTag} />
														</ThemeIcon>
													)}
													{!item.hasTicket && (
														<ThemeIcon
															size={40}
															variant="light"
															color="violet"
														>
															<Icon path={iconChat} />
														</ThemeIcon>
													)}
													<Stack gap={2.5}>
														<Group>
															<Text
																fz="lg"
																fw={item.read ? 400 : 600}
																c="bright"
															>
																{item.title.replace(htmlRegex, "")}
															</Text>
															{!item.read && (
																<Indicator
																	inset={0}
																	size={8}
																	color="surreal"
																/>
															)}
														</Group>
														<Group gap="xs">
															<Text c="surreal">
																{item.last_response_author?.name ||
																	"Unknown"}
															</Text>
															<Text
																c="slate.4"
																fz={4}
															>
																&#x2B24;
															</Text>
															<Text>
																{formatRelativeDate(
																	item.updated_at * 1000,
																)}
															</Text>
														</Group>
													</Stack>
												</Group>
											</UnstyledButton>
										</Fragment>
									))}
								</Stack>
							)}
						</ScrollArea>
					</Box>
				)}
			</Transition>
		</Drawer>
	);
}
