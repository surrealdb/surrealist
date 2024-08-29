import classes from "./style.module.scss";
import { BoxProps, Text, UnstyledButton } from "@mantine/core";
import { Center, Group, Paper, SimpleGrid, Stack } from "@mantine/core";
import { mdiEmailOutline } from "@mdi/js";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconBook, iconChat, iconDiscord } from "~/util/icons";

interface SupportTileProps extends BoxProps {
	icon: string;
	title: string;
	onClick?: () => void;
}

function SupportTile({
	icon,
	title,
	onClick,
	...props
}: SupportTileProps) {
	return (
		<UnstyledButton
			onClick={onClick}
		>
			<Paper
				withBorder
				style={{ aspectRatio: 1 }}
				className={classes.tile}
				{...props}
			>
				<Stack justify="center" align="center" h="100%">
					<Icon path={icon} size="xl" c="bright" />
					<Text>
						{title}
					</Text>
				</Stack>
			</Paper>
		</UnstyledButton>
	);
}

export function SupportPage() {
	return (
		<Center
			flex={1}
		>
			<Paper
				p="xl"
				bg="transparent"
				component={Stack}
			>
				<Group
					gap={35}
					flex={1}
					align="stretch"
				>
					<Stack flex={1} w={420}>
						<Group>
							<Icon path={mdiEmailOutline} />
							<PrimaryTitle>
								Looking for help?
							</PrimaryTitle>
						</Group>
						<Text>
							Running into issues with your cloud account, billing, or instances? We're here to help!
							Choose one of the following community support channels for help, or to get in touch with our team.
						</Text>
						<SimpleGrid cols={3} mt="md">
							<SupportTile
								icon={iconDiscord}
								title="Discord"
								onClick={() => adapter.openUrl("https://discord.gg/dc4JNWrrMc")}
							/>
							<SupportTile
								icon={iconBook}
								title="Documentation"
								onClick={() => adapter.openUrl("https://surrealdb.com/docs/cloud")}
							/>
							<SupportTile
								icon={iconChat}
								title="Discourse"
								onClick={() => adapter.openUrl("https://surrealdb.com/community/forums")}
							/>
						</SimpleGrid>
					</Stack>
					{/* <Divider
						orientation="vertical"
					/>
					<Stack flex={1} w={420}>
						<Group>
							<Icon path={mdiEmailOutline} />
							<PrimaryTitle>
								Submit a ticket
							</PrimaryTitle>
						</Group>
						<Text>
							Submit a ticket to get help with your account, billing, database, or any other issue experienced with Surreal Cloud. We aim to respond within 2-3 business days.
						</Text>
						<Text>
							Before we get started, please select the scope of your ticket.
						</Text>
						<Select
							value="account"
							data={[
								{ value: "account", label: "Account" },
								{ value: "billing", label: "Billing" },
								{ value: "database", label: "Database" },
								{ value: "other", label: "Other" },
							]}
						/>
						<Text>
							Please provide a clear subject and detailed message to help us understand your issue.
						</Text>
						<TextInput
							placeholder="Subject"
						/>
						<Textarea
							rows={10}
							placeholder="Message"
						/>
						<Group>
							<Spacer />
							<Button
								variant="gradient"
								size="xs"
								rightSection={<Icon path={iconCursor} />}
							>
								Submit ticket
							</Button>
						</Group>
					</Stack> */}
				</Group>
			</Paper>
		</Center>
	);
}