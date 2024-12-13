import { Indicator } from "@mantine/core";
import { useUnreadNewsPosts } from "~/hooks/newsfeed";
import { useFeatureFlags } from "~/util/feature-flags";
import { iconNewspaper } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { Icon } from "../Icon";
import { ActionButton } from "../ActionButton";

export function NewsFeed() {
	const [{ newsfeed }] = useFeatureFlags();
	const unread = useUnreadNewsPosts();

	return (
		newsfeed && (
			<Indicator disabled={unread.length === 0}>
				<ActionButton
					w={36}
					h={36}
					radius="md"
					variant="subtle"
					label="Latest news"
					onClick={() => dispatchIntent("open-news")}
				>
					<Icon
						path={iconNewspaper}
						size="lg"
					/>
				</ActionButton>
			</Indicator>
		)
	);
}
