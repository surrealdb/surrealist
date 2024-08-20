import classes from "./style.module.scss";
import { BoxProps, Button, Select, Text, Textarea, TextInput, UnstyledButton } from "@mantine/core";
import { Center, Divider, Group, Paper, SimpleGrid, Stack } from "@mantine/core";
import { mdiEmailOutline } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { iconBook, iconCursor, iconDiscord, iconStar } from "~/util/icons";

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
		<UnstyledButton>
			<Paper
				withBorder
				style={{ aspectRatio: 1 }}
				className={classes.tile}
				onClick={onClick}
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
				w={850}
				component={Stack}
			>
				<Group
					gap={35}
					flex={1}
					align="stretch"
				>
					<Stack flex={1}>
						<Group>
							<Icon path={iconStar} />
							<PrimaryTitle>
								Looking for help?
							</PrimaryTitle>
						</Group>
						<Text>
							Lorem ipsum dolor sit amet consectetur, adipisicing elit. Veritatis quas debitis vero corrupti hic alias, odio consequatur, exercitationem distinctio fuga eaque! Tenetur atque magnam ipsa inventore earum suscipit illo quidem.
						</Text>
						<SimpleGrid cols={3} mt="md">
							<SupportTile
								icon={iconDiscord}
								title="Community"
							/>
							<SupportTile
								icon={iconBook}
								title="Documentation"
							/>
							<SupportTile
								icon={mdiEmailOutline}
								title="Account help"
							/>
						</SimpleGrid>
					</Stack>
					<Divider
						orientation="vertical"
					/>
					<Stack flex={1}>
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
					</Stack>
				</Group>
			</Paper>
		</Center>
	);
}