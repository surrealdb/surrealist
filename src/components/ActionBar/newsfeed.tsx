import { ActionIcon, Indicator, Tooltip } from "@mantine/core";
import { useFeatureFlags } from "~/util/feature-flags";
import { Icon } from "../Icon";
import { iconNewspaper } from "~/util/icons";
import { useUnreadNewsPosts } from "~/hooks/newsfeed";
import { dispatchIntent } from "~/hooks/url";

export function NewsFeed() {
	const [{ newsfeed }] = useFeatureFlags();
	const unread = useUnreadNewsPosts();
	
	return newsfeed && (
		<Tooltip label="Latest news">
			<Indicator disabled={unread.length === 0}>
				<ActionIcon
					w={36}
					h={36}
					radius="md"
					onClick={() => dispatchIntent("open-news")}
					aria-label="Open news feed drawer"
					variant="subtle"
				>
					<Icon path={iconNewspaper} size="lg" />
				</ActionIcon>
			</Indicator>
		</Tooltip>
	);
}