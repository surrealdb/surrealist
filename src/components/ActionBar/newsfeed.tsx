import { Indicator } from "@mantine/core";
import { useUnreadNewsPosts } from "~/hooks/newsfeed";
import { iconNewspaper } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";

export function NewsFeed() {
	const unread = useUnreadNewsPosts();

	return (
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
	);
}
