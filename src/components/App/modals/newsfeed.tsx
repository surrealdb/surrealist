import {
	Alert,
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
	Transition,
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { format } from "date-fns";
import dayjs from "dayjs";
import { Fragment, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { MarkdownContent } from "~/components/MarkdownContent";
import { useLatestNewsQuery, useUnreadNewsPosts } from "~/hooks/newsfeed";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { tagEvent } from "~/util/analytics";
import { iconArrowLeft, iconArrowUpRight, iconClose } from "~/util/icons";
import classes from "../style.module.scss";

interface NewsItem {
	id: string;
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

	const [isOpen, openHandle] = useDisclosure();

	const [isReading, readingHandle] = useDisclosure();
	const [reading, setReading] = useState<NewsItem | null>(null);
	const [pendingEvent, setPendingEvent] = useState<object>();

	const readArticle = (item: NewsItem) => {
		setReading(item);
		readingHandle.open();

		setPendingEvent({
			blog_id: item.id,
			blog_name: item.title,
			open_time: new Date().toISOString(),
		});
	};

	const handleClose = useStable(() => {
		openHandle.close();
		readingHandle.close();
		updateViewedNews();

		tagEvent("blog_opened", {
			...pendingEvent,
			close_time: new Date().toISOString(),
		});
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
			opened={isOpen}
			onClose={handleClose}
			position="right"
			trapFocus={false}
			size={isReading ? "lg" : "md"}
			classNames={{
				content: classes.newsDrawerContent,
				body: classes.newsDrawerBody,
			}}
		>
			<Transition
				mounted={isReading}
				transition="fade"
			>
				{(styles) => (
					<Box
						pos="absolute"
						style={styles}
						inset={0}
					>
						{reading && (
							<ScrollArea
								className={classes.articleDrawer__scroll}
								pos="absolute"
								style={{ width: "var(--drawer-size-lg)" }}
								left={0}
								bottom={0}
								top={0}
							>
								<Box
									w="100%"
									h={250}
									pos="relative"
									className={classes.newsPostHeader}
									__vars={{
										"--image-url": `url("${reading.thumbnail}")`,
									}}
								>
									<ActionButton
										pos="absolute"
										size="lg"
										top={20}
										left={20}
										label="All articles"
										onClick={readingHandle.close}
										style={{ zIndex: 1, backdropFilter: "blur(4px)" }}
									>
										<Icon path={iconArrowLeft} />
									</ActionButton>

									<ActionButton
										pos="absolute"
										size="lg"
										top={20}
										right={20}
										label="Close"
										onClick={openHandle.close}
										style={{ zIndex: 1, backdropFilter: "blur(4px)" }}
									>
										<Icon path={iconClose} />
									</ActionButton>
								</Box>
								<Box
									p="xl"
									pt="xs"
									mt={-42}
								>
									<Title
										fz={28}
										c="bright"
										pos="relative"
									>
										{reading.title}
									</Title>
									<Text
										mt="lg"
										fz="lg"
									>
										{format(reading.published, "MMMM d, yyyy - h:mm a")}
									</Text>
									<Divider my="xl" />
									<MarkdownContent fz="lg">{reading.content}</MarkdownContent>
									{reading.link && (
										<Alert
											mt="xl"
											color="surreal.2"
											py={0}
										>
											<Link
												my="lg"
												display="block"
												href={reading.link}
											>
												<Text
													c="surreal"
													fw={600}
													fz={14}
												>
													Read on surrealdb.com
													<Icon
														path={iconArrowUpRight}
														right
													/>
												</Text>
											</Link>
										</Alert>
									)}
								</Box>
							</ScrollArea>
						)}
					</Box>
				)}
			</Transition>

			<Transition
				mounted={!isReading}
				transition="fade"
			>
				{(styles) => (
					<Box
						pos="absolute"
						style={styles}
						inset={0}
					>
						<Title
							fz={20}
							c="bright"
							m="xl"
						>
							Latest news
						</Title>
						<ScrollArea
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
									c="slate"
									ta="center"
								>
									No blog articles available
								</Text>
							) : (
								<Stack gap="xl">
									{newsQuery.data?.map((item, i) => (
										<Fragment key={i}>
											<UnstyledButton
												onClick={() => readArticle(item)}
												className={classes.newsItem}
											>
												<Image
													src={item.thumbnail}
													radius="lg"
													mb="lg"
												/>
												<Flex align="center">
													<Text py="xs">
														{dayjs(item.published).fromNow()}
													</Text>
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
													<Text c="surreal">Read article</Text>
													<Icon
														className={classes.newsItemArrow}
														path={iconArrowLeft}
														c="surreal"
													/>
												</Group>
											</UnstyledButton>
											{i < newsQuery.data?.length - 1 && <Divider />}
										</Fragment>
									))}
								</Stack>
							)}
						</ScrollArea>
					</Box>
				)}
			</Transition>
		</Drawer>
	);
}
