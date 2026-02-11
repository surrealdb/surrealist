import { Indicator } from "@mantine/core";
import { Icon, iconNewspaper } from "@surrealdb/ui";
import { useUnreadNewsPosts } from "~/hooks/newsfeed";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";

export function NewsFeed() {
	const unread = useUnreadNewsPosts();

	return (
		<Indicator disabled={unread.length === 0}>
			<ActionButton
				w={36}
				h={36}
				variant="subtle"
				label="Latest news"
				tooltipProps={{
					position: "bottom",
					label: "Latest news",
					children: null,
				}}
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
