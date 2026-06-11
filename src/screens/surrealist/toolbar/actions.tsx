import { Button, Group } from "@mantine/core";
import { Icon, iconStar } from "@surrealdb/ui";
import { ActionBar } from "~/components/ActionBar";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import classes from "./style.module.scss";

export function ToolbarActions() {
	const { readChangelog } = useInterfaceStore.getState();
	const [{ changelog }] = useFeatureFlags();

	const showChangelog = useInterfaceStore((s) => s.showChangelogAlert);
	const hasReadChangelog = useInterfaceStore((s) => s.hasReadChangelog);

	const openChangelog = useStable(() => {
		dispatchIntent("open-changelog");
		readChangelog();
	});

	const isChangelogVisible = changelog === "auto" ? showChangelog : changelog !== "hidden";

	return (
		<Group
			className={classes.actions}
			gap="md"
			wrap="nowrap"
		>
			{isChangelogVisible && (
				<Button
					className={classes.changelog}
					h={34}
					size="xs"
					variant={
						(changelog === "auto" ? hasReadChangelog : changelog === "read")
							? "light"
							: "gradient"
					}
					style={{ border: "none" }}
					onClick={openChangelog}
					leftSection={
						<Icon
							path={iconStar}
							size="lg"
						/>
					}
				>
					<span className={classes.changelogLabel}>
						What's new in {import.meta.env.VERSION}
					</span>
				</Button>
			)}

			<ActionBar />
		</Group>
	);
}
