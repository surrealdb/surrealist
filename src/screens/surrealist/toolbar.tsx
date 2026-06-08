import { Button, Group } from "@mantine/core";
import { Icon, iconSidebar, iconStar } from "@surrealdb/ui";
import { ActionBar } from "~/components/ActionBar";
import { ActionButton } from "~/components/ActionButton";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { ToolbarBreadcrumbs } from "./components/ToolbarBreadcrumbs";

export function SurrealistToolbar() {
	const { readChangelog } = useInterfaceStore.getState();
	const [{ changelog }] = useFeatureFlags();

	const showChangelog = useInterfaceStore((s) => s.showChangelogAlert);
	const hasReadChangelog = useInterfaceStore((s) => s.hasReadChangelog);
	const toolbarInset = useInterfaceStore((s) => s.toolbarInset);

	const [sidebarMode, setSidebarMode] = useSetting("appearance", "sidebarMode");

	const toggleSidebarMode = useStable(() => {
		setSidebarMode(sidebarMode === "compact" ? "wide" : "compact");
	});

	const openChangelog = useStable(() => {
		dispatchIntent("open-changelog");
		readChangelog();
	});

	const isCompact = sidebarMode === "compact";
	const isChangelogVisible = changelog === "auto" ? showChangelog : changelog !== "hidden";

	return (
		<>
			<ActionButton
				label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
				onClick={toggleSidebarMode}
				size="md"
			>
				<Icon path={iconSidebar} />
			</ActionButton>

			<Group
				flex={1}
				miw={0}
				gap="md"
				wrap="nowrap"
			>
				<ToolbarBreadcrumbs />
				{toolbarInset}
			</Group>

			{isChangelogVisible && (
				<Button
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
					What's new in {import.meta.env.VERSION}
				</Button>
			)}

			<ActionBar />
		</>
	);
}
