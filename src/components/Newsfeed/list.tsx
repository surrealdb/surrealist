import {
	Badge,
	Divider,
	Flex,
	Group,
	Image,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Title,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconArrowLeft } from "@surrealdb/ui";
import dayjs from "dayjs";
import { Fragment, useLayoutEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { useLatestNewsQuery, useUnreadNewsPosts } from "~/hooks/newsfeed";
import { tagEvent } from "~/util/analytics";
import classes from "./style.module.scss";

/**
 * The scrollable, paginated list of blog articles. Shared between the desktop
 * newsfeed drawer and the mobile bottom-card news panel. Fills its container.
 */
export function NewsfeedList() {
	const newsQuery = useLatestNewsQuery();
	const unread = useUnreadNewsPosts();
	const pagination = usePagination();
	const viewportRef = useRef<HTMLDivElement>(null);

	const posts = newsQuery.data ?? [];
	const startAt = (pagination.currentPage - 1) * pagination.pageSize;
	const pageSlice = useMemo(
		() => posts.slice(startAt, startAt + pagination.pageSize),
		[posts, startAt, pagination.pageSize],
	);

	useLayoutEffect(() => {
		pagination.setTotal(posts.length);
	}, [pagination.setTotal, posts.length]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll to top on page change
	useLayoutEffect(() => {
		viewportRef.current?.scrollTo({ top: 0 });
	}, [pagination.currentPage]);

	const readArticle = (item: (typeof posts)[number]) => {
		const timestamp = new Date().toISOString();

		adapter.openUrl(item.link);

		tagEvent("blog_opened", {
			blog_id: item.id,
			blog_name: item.title,
			open_time: timestamp,
			close_time: timestamp,
		});
	};

	const isEmpty = newsQuery.isFetched && posts.length === 0;

	return (
		<Flex
			direction="column"
			h="100%"
			mih={0}
		>
			<ScrollArea
				viewportRef={viewportRef}
				flex={1}
				p="lg"
			>
				{newsQuery.isPending ? (
					<Loader
						mt={32}
						mx="auto"
						display="block"
					/>
				) : isEmpty ? (
					<Text
						mt={68}
						c="obsidian"
						ta="center"
					>
						No blog articles available
					</Text>
				) : (
					<Stack
						gap="xl"
						pb="lg"
					>
						{pageSlice.map((item, i) => (
							<Fragment key={item.id}>
								<UnstyledButton
									onClick={() => readArticle(item)}
									className={classes.item}
								>
									<Image
										src={item.thumbnail}
										radius="lg"
										mb="lg"
										h={225}
									/>
									<Flex align="center">
										<Text py="xs">{dayjs(item.published).fromNow()}</Text>
										{unread.includes(item.id) && (
											<Badge
												variant="light"
												color="violet"
												ml="sm"
											>
												New
											</Badge>
										)}
									</Flex>
									<Title
										fz={18}
										c="bright"
										mt={4}
									>
										{item.title}
									</Title>
									<Text py="sm">{item.description}</Text>
									<Group
										mt="sm"
										gap="xs"
									>
										<Text c="violet">Read article</Text>
										<Icon
											className={classes.itemArrow}
											path={iconArrowLeft}
											c="violet"
										/>
									</Group>
								</UnstyledButton>
								{i < pageSlice.length - 1 && <Divider />}
							</Fragment>
						))}
					</Stack>
				)}
			</ScrollArea>

			{!newsQuery.isPending && !isEmpty && pagination.pageCount > 1 && (
				<Paper>
					<Divider />
					<Group
						p="lg"
						justify="center"
						gap="xs"
						wrap="nowrap"
					>
						<Pagination
							store={pagination}
							withResultsPerPage={false}
						/>
					</Group>
				</Paper>
			)}
		</Flex>
	);
}
