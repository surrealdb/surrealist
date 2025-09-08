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
	ThemeIcon,
} from "@mantine/core";
import { navigate } from "wouter/use-browser-location";
import { useCloudConversationQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { formatRelativeDate } from "~/util/helpers";
import { iconArrowLeft, iconBullhorn, iconChat, iconClock, iconSurreal } from "~/util/icons";
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

	const title = conversation?.title.replace(htmlRegex, "");

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
												title="Last updated"
												subtitle={formatRelativeDate(
													conversation.updated_at * 1000,
												)}
												color="green"
												icon={iconClock}
											/>
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
										</Stack>
									</Paper>
								</Group>
								<PrimaryTitle mt="lg">
									{conversation.parts.length} Updates
								</PrimaryTitle>
								<Divider />
							</Stack>
						)}

						<Stack gap="lg">
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
			)}
		</Box>
	);
}
