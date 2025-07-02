import surrealImg from "~/assets/images/surrealdb.png";

import {
	Avatar,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";

import {
	iconAccount,
	iconArrowLeft,
	iconBullhorn,
	iconChat,
	iconClose,
	iconCursor,
	iconTarget,
} from "~/util/icons";

import { formatRelative, subDays } from "date-fns";
import { useLocation } from "wouter";
import { AccountAvatar } from "~/components/AccountAvatar";
import { AuthGuard } from "~/components/AuthGuard";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useCloudStore } from "~/stores/cloud";
import classes from "./style.module.scss";

export interface TicketPageProps {
	id: string;
}

export function TicketPage({ id }: TicketPageProps) {
	const [, navigate] = useLocation();
	const profile = useCloudStore((s) => s.profile);

	if (id === "0") {
		return <div />;
	}

	return (
		<AuthGuard>
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
						<Group wrap="nowrap">
							<PrimaryTitle>Ticket #{id}</PrimaryTitle>
							<Spacer />
							<Button
								variant="light"
								color="slate"
								leftSection={<Icon path={iconArrowLeft} />}
								onClick={() => navigate("/cloud/tickets")}
								size="xs"
							>
								Back to overview
							</Button>
						</Group>
						{/* <Group mt="xs">
						<Badge
							leftSection={
								<Icon
									path={iconBullhorn}
									mr="xs"
								/>
							}
							variant="light"
							color="slate"
							size="sm"
							h={24}
							px="sm"
						>
							Technical
						</Badge>
						<Badge
							leftSection={
								<Icon
									path={iconTarget}
									mr="xs"
								/>
							}
							variant="light"
							color="slate"
							size="sm"
							h={24}
							px="sm"
						>
							Medium - p3
						</Badge>
					</Group> */}
						<Group
							mt="md"
							wrap="nowrap"
							align="start"
						>
							<Paper
								p="lg"
								flex={1}
							>
								<Group
									wrap="nowrap"
									align="start"
									gap="xl"
								>
									<AccountAvatar />
									<Box flex={1}>
										<Text
											fw="500"
											c="bright"
											fz="lg"
										>
											{profile.name}
										</Text>
										<Text c="slate">
											{formatRelative(subDays(new Date(), 4), new Date())}
										</Text>
										<Text mt="md">Hi,</Text>
										<br />
										<Text>
											Lorem ipsum dolor sit amet consectetur adipisicing elit.
											Architecto, cum officia? Modi suscipit ullam excepturi,
											adipisci facere illo sequi laboriosam quisquam corrupti.
											Sunt enim, deserunt repellendus id non sapiente
											mollitia.
										</Text>
										<br />
										<Text>
											Lorem ipsum dolor sit amet consectetur adipisicing elit.
											Architecto, cum officia? Modi suscipit ullam excepturi,
											adipisci facere illo sequi laboriosam quisquam corrupti.
											Sunt enim, deserunt repellendus id non sapiente
											mollitia.
										</Text>
										<br />
										<Text>Thanks!</Text>
									</Box>
								</Group>
							</Paper>
							<Paper
								p="lg"
								flex={1}
								maw={225}
							>
								<Stack gap="lg">
									<Group>
										<ThemeIcon
											size="lg"
											variant="light"
											color="orange"
										>
											<Icon path={iconChat} />
										</ThemeIcon>
										<Box>
											<Label
												mb={0}
												fz="xs"
												c="slate.3"
											>
												Status
											</Label>
											<Text c="bright">Awaiting response</Text>
										</Box>
									</Group>
									<Divider />
									<Group>
										<ThemeIcon
											size="lg"
											variant="light"
										>
											<Icon path={iconBullhorn} />
										</ThemeIcon>
										<Box>
											<Label
												mb={0}
												fz="xs"
												c="slate.3"
											>
												Type
											</Label>
											<Text c="bright">Technical</Text>
										</Box>
									</Group>
									<Group>
										<ThemeIcon
											size="lg"
											variant="light"
											color="blue"
										>
											<Icon path={iconTarget} />
										</ThemeIcon>
										<Box>
											<Label
												mb={0}
												fz="xs"
												c="slate.3"
											>
												Severity
											</Label>
											<Text c="bright">Medium - p3</Text>
										</Box>
									</Group>
									<Group wrap="nowrap">
										<ThemeIcon
											size="lg"
											variant="light"
											color="green"
										>
											<Icon path={iconAccount} />
										</ThemeIcon>
										<Box miw={0}>
											<Label
												mb={0}
												fz="xs"
												c="slate.3"
											>
												Submitter
											</Label>
											<Text
												c="bright"
												truncate
											>
												{profile.name}
											</Text>
										</Box>
									</Group>
								</Stack>
							</Paper>
						</Group>

						<PrimaryTitle mt="xl">1 Reply</PrimaryTitle>
						<Divider mt="xs" />

						<Paper
							p="lg"
							mt="xl"
						>
							<Group
								wrap="nowrap"
								align="start"
								gap="xl"
							>
								<Avatar
									radius="md"
									size={36}
									src={surrealImg}
									bg="surreal.0"
									name="John Doe"
								/>
								<Box flex={1}>
									<Group gap="xs">
										<Text
											fw="500"
											c="bright"
											fz="lg"
										>
											SurrealDB Team
										</Text>
										<Badge
											color="blue"
											size="xs"
											variant="light"
										>
											Support agent
										</Badge>
									</Group>
									<Text c="slate">
										{formatRelative(subDays(new Date(), 3), new Date())}
									</Text>
									<Text mt="md">Hello!</Text>
								</Box>
							</Group>
						</Paper>

						<Text
							ta="center"
							mt={42}
						>
							This ticket is open and our support team is working on it.
						</Text>

						<Group
							mt="xl"
							justify="center"
						>
							<Button
								variant="gradient"
								rightSection={<Icon path={iconCursor} />}
							>
								Send a reply
							</Button>
							<Button
								variant="light"
								color="slate"
								rightSection={<Icon path={iconClose} />}
							>
								Close ticket
							</Button>
						</Group>
					</Box>
				</ScrollArea>
			</Box>
		</AuthGuard>
	);
}

export default TicketPage;
