import classes from "./style.module.scss";
import dayjs from "dayjs";
import posthog from "posthog-js";
import { Alert, Anchor, Badge, Box, Button, Divider, Drawer, Flex, Image, Indicator, Loader, ScrollArea, Stack, Title, Tooltip, Transition, TypographyStylesProvider, UnstyledButton } from "@mantine/core";
import { Text } from "@mantine/core";
import { ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Fragment, useEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { useIntent } from "~/hooks/url";
import { iconArrowUpRight, iconChevronLeft, iconChevronRight, iconClose, iconNewspaper } from "~/util/icons";
import { useConfigStore } from "~/stores/config";
import { useFeatureFlags } from "~/util/feature-flags";

interface NewsItem {
	id: string;
	title: string;
	link: string;
	description: string;
	thumbnail: string;
	content: string;
	published: string;
}

export function NewsFeed() {
	const { updateViewedNews } = useConfigStore.getState();
	const [{ newsfeed }] = useFeatureFlags();

	const [isOpen, openHandle] = useDisclosure();
	const [isLoading, setLoading] = useState(true);
	const [unreadIds, setUnreadIds] = useState<string[]>([]);
	const [items, setItems] = useState<NewsItem[]>([]);

	const [isReading, readingHandle] = useDisclosure();
	const [reading, setReading] = useState<NewsItem | null>(null);

	const lastViewedAt = useConfigStore(s => s.lastViewedNewsAt);

	useIntent("open-news", openHandle.open);

	const fetchFeed = async () => {
		setLoading(true);

		try {
			const response = await fetch(`https://surrealdb.com/feed/blog.rss`);
			const body = await response.text();
			const result = new DOMParser().parseFromString(body, 'text/xml');

			const items = [...result.querySelectorAll('item')]
				.filter(item =>
					[...item.querySelectorAll('category')].some(child => child.textContent?.toLowerCase() === "surrealist")
				)
				.map(item => ({
					id: item.querySelector('guid')?.textContent || '',
					title: item.querySelector('title')?.textContent || '',
					link: item.querySelector('link')?.textContent || '',
					description: item.querySelector('description')?.textContent || '',
					thumbnail: item.querySelector('content')?.getAttribute('url') || '',
					content: item.querySelector('encoded')?.textContent || '',
					published: item.querySelector('pubDate')?.textContent || ''
				}));

			setLoading(false);
			setItems(items);

			if (lastViewedAt !== null) {
				const lastViewed = new Date(lastViewedAt);

				setUnreadIds(items
					.filter(item => new Date(item.published) > lastViewed)
					.map(item => item.id)
				);
			}
		} catch(err: any) {
			console.error('Failed to fetch news feed', err);
			setLoading(false);
		}
	};

	const readArticle = (item: NewsItem) => {
		setReading(item);
		readingHandle.open();
		posthog.capture('newsfeed_read', {
			article: item.id
		});
	};

	useEffect(() => {
		fetchFeed();
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchFeed();
			updateViewedNews();

			posthog.capture('newsfeed_open');
		} else {
			readingHandle.close();
		}
	}, [isOpen]);

	const isEmpty = items.length === 0;

	return (
		<>
			{newsfeed && (
				<Tooltip label="Latest news">
					<Indicator disabled={unreadIds.length === 0}>
						<ActionIcon
							w={36}
							h={36}
							onClick={openHandle.toggle}
							aria-label="Open news feed drawer"
						>
							<Icon path={iconNewspaper} size="lg" />
						</ActionIcon>
					</Indicator>
				</Tooltip>
			)}

			<Drawer
				opened={isOpen}
				onClose={openHandle.close}
				position="right"
				trapFocus={false}
				size={isReading ? 'lg' : 'md'}
				classNames={{
					content: classes.drawerContent,
					body: classes.drawerBody
				}}
			>
				<ActionIcon
					pos="absolute"
					top={20}
					right={20}
					onClick={openHandle.close}
					style={{ zIndex: 1 }}
					aria-label="Close news feed drawer"
				>
					<Icon path={iconClose} />
				</ActionIcon>

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
									style={{ width: 'var(--drawer-size-lg)' }}
									left={0}
									bottom={0}
									top={0}
								>
									<Box
										w="100%"
										h={250}
										className={classes.readingHeader}
										__vars={{
											'--image-url': `url("${reading.thumbnail}")`
										}}
									>
										<Button
											m="md"
											pos="relative"
											onClick={readingHandle.close}
											leftSection={<Icon path={iconChevronLeft} size="sm" />}
											className={classes.backButton}
											size="md"
										>
											Go back
										</Button>
									</Box>
									<Box p="xl" pt="xs" mt={-52}>
										<Text c="slate">
											{dayjs(reading.published).fromNow()}
										</Text>
										<Title fz={28} c="bright">
											{reading.title}
										</Title>
										<TypographyStylesProvider mt="lg" fz={14}>
											<div dangerouslySetInnerHTML={{ __html: reading.content }} />
										</TypographyStylesProvider>
										{reading.link && (
											<Alert
												mt="xl"
												color="surreal.2"
												py={0}
											>
												<Anchor
													my="lg"
													display="block"
													underline="never"
													href={reading.link}
												>
													<Text
														c="surreal"
														fw={600}
														fz={14}
													>
														Read on surrealdb.com
														<Icon path={iconArrowUpRight} right />
													</Text>
												</Anchor>
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
							<Title fz={20} c="bright" m="xl">
								Latest news
							</Title>
							<ScrollArea
								pos="absolute"
								style={{ width: 'var(--drawer-size-md)' }}
								left={0}
								bottom={0}
								top={64}
								p="lg"
							>
								{isLoading && isEmpty ? (
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
										{items.map((item, i) => (
											<Fragment key={i}>
												<UnstyledButton
													onClick={() => readArticle(item)}
												>
													<Image
														src={item.thumbnail}
														radius="lg"
														mb="lg"
													/>
													<Flex align="center">
														<Text c="slate">
															{dayjs(item.published).fromNow()}
														</Text>
														{unreadIds.includes(item.id) && (
															<Badge
																color="surreal"
																variant="light"
																size="xs"
																ml="xs"
															>
																New post
															</Badge>
														)}
													</Flex>
													<Title fz={18} c="bright">
														{item.title}
													</Title>
													<Text py="sm">
														{item.description}
													</Text>
													<Text
														c="surreal"
														fw={600}
													>
														Read more
														<Icon path={iconChevronRight} right />
													</Text>
												</UnstyledButton>
												{i < items.length - 1 && <Divider />}
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
