import { Box, Drawer, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconClose } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { NewsfeedList } from "~/components/Newsfeed/list";
import { Spacer } from "~/components/Spacer";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { tagEvent } from "~/util/analytics";
import classes from "../style.module.scss";

export function NewsFeedDrawer() {
	const { updateViewedNews } = useConfigStore.getState();
	const newsQuery = useLatestNewsQuery();

	const [isOpen, openHandle] = useDisclosure();

	const handleClose = useStable(() => {
		openHandle.close();
		updateViewedNews();
	});

	useIntent("open-news", ({ id }) => {
		openHandle.open();

		const article = newsQuery.data?.find((item) => item.id === id);

		if (article) {
			const timestamp = new Date().toISOString();

			adapter.openUrl(article.link);

			tagEvent("blog_opened", {
				blog_id: article.id,
				blog_name: article.title,
				open_time: timestamp,
				close_time: timestamp,
			});
		}
	});

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
			<Box
				flex={1}
				mih={0}
			>
				<NewsfeedList />
			</Box>
		</Drawer>
	);
}
