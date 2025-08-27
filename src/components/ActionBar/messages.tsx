import { Indicator } from "@mantine/core";
import { useConversationsQuery } from "~/cloud/queries/context";
import { useStable } from "~/hooks/stable";
import { iconChat } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";
import classes from "./style.module.scss";

export function MessagesAction() {
	const conversationsQuery = useConversationsQuery();

	const handleOpen = useStable(() => {
		dispatchIntent("open-messages");
	});

	const hasUnread =
		conversationsQuery.isFetched &&
		conversationsQuery.data?.some((conversation) => !conversation.read);

	return (
		<Indicator disabled={!hasUnread}>
			<div className={classes.starContainer}>
				<ActionButton
					w={36}
					h={36}
					radius="md"
					variant="subtle"
					label="Messages"
					tooltipProps={{
						position: "bottom",
						label: "Messages",
						children: null,
					}}
					onClick={handleOpen}
				>
					<Icon
						path={iconChat}
						size="lg"
					/>
				</ActionButton>
			</div>
		</Indicator>
	);
}
