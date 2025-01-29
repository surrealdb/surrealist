import classes from "../style.module.scss";

import {
	Alert,
	Badge,
	Box,
	Button,
	Divider,
	Drawer,
	Flex,
	Image,
	Loader,
	ScrollArea,
	Stack,
	Title,
	Transition,
	TypographyStylesProvider,
	UnstyledButton,
} from "@mantine/core";

import { iconArrowUpRight, iconChevronLeft, iconChevronRight, iconClose } from "~/util/icons";

import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { useLatestNewsQuery, useUnreadNewsPosts } from "~/hooks/newsfeed";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { captureMetric } from "~/util/metrics";

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

	const readArticle = (item: NewsItem) => {
		setReading(item);
		readingHandle.open();
		captureMetric("newsfeed_read", {
			article: item.id,
		});
	};

	const handleClose = useStable(() => {
		openHandle.close();
		readingHandle.close();
		updateViewedNews();
	});

	useEffect(() => {
		if (isOpen) {
			captureMetric("newsfeed_open");
		}
	}, [isOpen]);

	useIntent("open-news", ({ id }) => {
		openHandle.open();

		const article = newsQuery.data?.find((item) => item.id === id);

		if (article) {
			readArticle(article);
		}
	});

	const isEmpty = newsQuery.isFetched && newsQuery.data?.length === 0;

	return (
		<>
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
				<ActionButton
					pos="absolute"
					top={20}
					right={20}
					label="Close"
					onClick={openHandle.close}
					style={{ zIndex: 1 }}
				>
					<Icon path={iconClose} />
				</ActionButton>

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
									pos="absolute"
									style={{ width: "var(--drawer-size-lg)" }}
									left={0}
									bottom={0}
									top={0}
								>
									<Box
										w="100%"
										h={250}
										className={classes.newsPostHeader}
										__vars={{
											"--image-url": `url("${reading.thumbnail}")`,
										}}
									>
										<Button
											m="md"
											pos="relative"
											onClick={readingHandle.close}
											leftSection={
												<Icon
													path={iconChevronLeft}
													size="sm"
												/>
											}
											className={classes.newsPostBack}
											size="md"
										>
											Go back
										</Button>
									</Box>
									<Box
										p="xl"
										pt="xs"
										mt={-52}
									>
										<Text c="slate">{dayjs(reading.published).fromNow()}</Text>
										<Title
											fz={28}
											c="bright"
										>
											{reading.title}
										</Title>
										<TypographyStylesProvider
											mt="lg"
											fz={14}
											className={classes.newsPostContent}
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Replace with markdown
											dangerouslySetInnerHTML={{
												__html: reading.content,
											}}
										/>
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
										No news items available
									</Text>
								) : (
									<Stack gap="xl">
										{newsQuery.data?.map((item, i) => (
											<Fragment key={i}>
												<UnstyledButton onClick={() => readArticle(item)}>
													<Image
														src={item.thumbnail}
														radius="lg"
														mb="lg"
													/>
													<Flex align="center">
														<Text c="slate">
															{dayjs(item.published).fromNow()}
														</Text>
														{unread.includes(item.id) && (
															<Badge
																color="surreal"
																size="xs"
																ml="sm"
																h={14}
															>
																New post
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
													<Text
														c="surreal"
														fw={600}
													>
														Read more
														<Icon
															path={iconChevronRight}
															right
														/>
													</Text>
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
		</>
	);
}
