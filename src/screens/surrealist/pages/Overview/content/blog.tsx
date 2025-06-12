import { Group, Text } from "@mantine/core";
import classes from "../style.module.scss";

import { Box, BoxProps, Paper, UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { format } from "date-fns";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { NewsPost } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { iconArrowLeft } from "~/util/icons";
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
			{...other}
		>
			<Paper className={clsx(classes.startBox, classes.startBlog)}>
				<Box
					w="100%"
					h={200}
					className={classes.startBlogHeader}
					__vars={{
						"--image-url": `url("${post.thumbnail}")`,
					}}
				/>
				<Box
					p="xl"
					pt="xs"
					mt={-42}
				>
					<PrimaryTitle
						fz={26}
						lh="h1"
						mih={106}
						lineClamp={3}
					>
						{post.title}
					</PrimaryTitle>
					<Group
						mt="sm"
						gap="xs"
					>
						<Text>{format(post.published, "MMMM d, yyyy - h:mm a")}</Text>
						<Spacer />
						<Text c="surreal">Read article</Text>
						<Icon
							className={classes.startBlogArrow}
							path={iconArrowLeft}
							c="surreal"
						/>
					</Group>
				</Box>
			</Paper>
		</UnstyledButton>
	);
}
