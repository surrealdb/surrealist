import { Box, Button, Center, Group, Loader, ScrollArea, Stack } from "@mantine/core";
import { Icon, iconPlus } from "@surrealdb/ui";
import { useConversationsQuery } from "~/cloud/queries/context";
import { AuthGuard } from "~/components/AuthGuard";
import { ConversationTable } from "~/components/ConversationTable";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { dispatchIntent } from "~/util/intents";
import classes from "../style.module.scss";

export function RequestsPage() {
	const { data: requests, isLoading } = useConversationsQuery();

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
						h="100%"
						mx="auto"
						maw={1000}
						pb={68}
					>
						<Box>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{ label: "Support", href: "/support" },
									{ label: "Requests" },
								]}
							/>
							<Group>
								<PrimaryTitle
									fz={32}
									mt="sm"
								>
									Support tickets
								</PrimaryTitle>
								<Spacer />

								<Button
									variant="gradient"
									size="xs"
									rightSection={<Icon path={iconPlus} />}
									onClick={() => {
										dispatchIntent("create-message", { type: "ticket" });
									}}
								>
									Create new ticket
								</Button>
							</Group>
						</Box>

						<ConversationTable
							conversations={requests ?? []}
							isLoading={isLoading}
							defaultSortMode="updated_latest"
							defaultType="open"
						/>
					</Stack>
				</ScrollArea>
			</Box>
		</AuthGuard>
	);
}
