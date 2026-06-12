import {
	Badge,
	Box,
	Divider,
	Drawer,
	Flex,
	Group,
	Image,
	Loader,
	ScrollArea,
	Stack,
	Text,
	Title,
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconArrowLeft, iconClose } from "@surrealdb/ui";
import dayjs from "dayjs";
import { Fragment, useLayoutEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { Spacer } from "~/components/Spacer";
import { useLatestNewsQuery, useUnreadNewsPosts } from "~/hooks/newsfeed";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { tagEvent } from "~/util/analytics";
import classes from "../style.module.scss";

interface NewsItem {
	id: string;
	slug: string;
	title: string;
	link: string;
	description: string;
	thumbnail: string;
	content: string;
	published: string;
}

export function NewsFeedDrawer() {
	const { updateViewedNews } = useConfigStore.getState();
	const newsQuery = useLatestNewsQuery();
	const unread = useUnreadNewsPosts();
	const pagination = usePagination();
	const viewportRef = useRef<HTMLDivElement>(null);

	const [isOpen, openHandle] = useDisclosure();

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

	const readArticle = (item: NewsItem) => {
		const timestamp = new Date().toISOString();

		adapter.openUrl(item.link);

		tagEvent("blog_opened", {
			blog_id: item.id,
			blog_name: item.title,
			open_time: timestamp,
			close_time: timestamp,
		});
	};

	const handleClose = useStable(() => {
		openHandle.close();
		updateViewedNews();
		pagination.setCurrentPage(1);
	});

	useIntent("open-news", ({ id }) => {
		openHandle.open();

		const article = newsQuery.data?.find((item) => item.id === id);

		if (article) {
			readArticle(article);
		}
	});

	const isEmpty = newsQuery.isFetched && newsQuery.data?.length === 0;

	return (
		<Drawer
			withCloseButton={false}
			opened={isOpen}
			onClose={handleClose}
			position="right"
			trapFocus={false}
			classNames={{
				content: classes.newsDrawerContent,
				body: classes.newsDrawerBody,
			}}
		>
			<Box
				pos="absolute"
				inset={0}
			>
				<Group>
					<Title
						fz={20}
						c="bright"
						m="xl"
					>
						Latest news
					</Title>
					<Spacer />
					<ActionButton
						variant="light"
						label="Close"
						mr="lg"
						onClick={handleClose}
					>
						<Icon path={iconClose} />
					</ActionButton>
				</Group>
				<ScrollArea
					viewportRef={viewportRef}
					pos="absolute"
					style={{ width: "var(--drawer-size-md)" }}
					left={0}
					bottom={0}
					top={64}
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
							pb={86}
						>
							{pageSlice.map((item, i) => (
								<Fragment key={item.id}>
									<UnstyledButton
										onClick={() => readArticle(item)}
										className={classes.newsItem}
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
												className={classes.newsItemArrow}
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
					<Box
						pos="absolute"
						left={0}
						right={0}
						bottom={0}
					>
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
					</Box>
				)}
			</Box>
		</Drawer>
	);
}
