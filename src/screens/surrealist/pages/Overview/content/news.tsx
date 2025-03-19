import classes from "../style.module.scss";

import { Box, BoxProps, Flex, Paper, Title, UnstyledButton } from "@mantine/core";
import { Text } from "@mantine/core";
import clsx from "clsx";
import dayjs from "dayjs";
import { useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { NewsPost } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { iconChevronRight } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";

export interface StartNewsProps extends BoxProps {
	post: NewsPost;
}

export function StartNews({ post, ...other }: StartNewsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const handleClick = useStable(() => {
		dispatchIntent("open-news", { id: post.id });
	});

	return (
		<UnstyledButton
			onClick={handleClick}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startNews)}
				ref={containerRef}
			>
				<Flex
					gap="xl"
					className={classes.startNewsInner}
				>
					<Paper
						className={classes.startNewsThumbnail}
						style={{
							backgroundImage: `url("${post.thumbnail}")`,
						}}
					/>
					<Box
						h="100%"
						flex={1}
						style={{ alignSelf: "start" }}
					>
						<Title
							c="bright"
							fz="xl"
						>
							{post.title}
						</Title>
						<Text c="slate">{dayjs(post.published).fromNow()}</Text>
						<Text mt="sm">{post.description}</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						c="slate"
						size="xl"
						style={{
							alignSelf: "center",
						}}
					/>
				</Flex>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
