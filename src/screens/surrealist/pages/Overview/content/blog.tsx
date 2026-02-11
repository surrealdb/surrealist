import { Anchor, Box, BoxProps, Paper, Stack, Text, UnstyledButton } from "@mantine/core";
import { format } from "date-fns";
import { NewsPost } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/util/intents";

export interface StartBlogProps extends BoxProps {
	post: NewsPost;
}

export function StartBlog({ post, ...other }: StartBlogProps) {
	const handleClick = useStable(() => {
		dispatchIntent("open-news", { id: post.id });
	});

	return (
		<UnstyledButton
			onClick={handleClick}
			style={{ height: "100%" }}
			{...other}
		>
			<Anchor
				variant="glow"
				style={{ height: "100%", display: "block" }}
			>
				<Paper
					withBorder
					radius="md"
					h="100%"
					display="flex"
					style={{
						flexDirection: "column",
					}}
				>
					<Box
						w="100%"
						h={275}
						style={{
							backgroundPosition: "center",
							backgroundSize: "cover",
							backgroundImage: `url("${post.thumbnail}")`,
							borderTopLeftRadius: "var(--mantine-radius-md)",
							borderTopRightRadius: "var(--mantine-radius-md)",
						}}
					/>
					<Stack
						p="lg"
						flex={1}
						gap="xs"
						h="auto"
						justify="center"
					>
						<Text
							fz="xl"
							c="bright"
							fw={600}
						>
							{post.title}
						</Text>
						<Text>{format(post.published, "MMMM d, yyyy - h:mm a")}</Text>
					</Stack>
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}
