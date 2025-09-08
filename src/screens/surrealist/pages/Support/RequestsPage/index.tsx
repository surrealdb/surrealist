import { Box, Button, Center, Loader, ScrollArea, Stack, Text } from "@mantine/core";
import { navigate } from "wouter/use-browser-location";
import { useConversationsQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconArrowLeft } from "~/util/icons";
import { ConversationCard } from "../ConversationCard";
import classes from "../style.module.scss";

export function RequestsPage() {
	const { data: requests, isLoading } = useConversationsQuery();

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

			{!isLoading && !requests && (
				<Center
					w="100%"
					h="100%"
					flex={1}
				>
					<Stack
						gap={0}
						align="center"
					>
						<PrimaryTitle>No requests found</PrimaryTitle>
						<Text>You have no current or previous support requests</Text>
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

			{!isLoading && requests && requests.length > 0 && (
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
									{ label: "Requests" },
								]}
							/>
							<PrimaryTitle
								fz={32}
								mt="sm"
							>
								Support requests
							</PrimaryTitle>
						</Box>

						<Stack
							gap={5}
							ml="-xs"
						>
							{requests
								.sort((a, b) => b.updated_at - a.updated_at)
								.map((request) => (
									<Box
										p="xs"
										key={request.id}
										style={{
											cursor: "pointer",
										}}
										className={classes.messageItem}
										onClick={() =>
											navigate(`/support/conversations/${request.id}`)
										}
									>
										<ConversationCard conversation={request} />
									</Box>
								))}
						</Stack>
					</Stack>
				</ScrollArea>
			)}
		</Box>
	);
}
