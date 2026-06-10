import { Box, Button, Group, UnstyledButton } from "@mantine/core";
import { Icon, iconChevronLeft, iconChevronRight, iconSidebar, iconStar } from "@surrealdb/ui";
import { ActionBar } from "~/components/ActionBar";
import { ActionButton } from "~/components/ActionButton";
import { useSetting } from "~/hooks/config";
import { useScroller } from "~/hooks/scroller";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { ToolbarBreadcrumbs } from "../components/ToolbarBreadcrumbs";
import classes from "./style.module.scss";

export function SurrealistToolbar() {
	const { readChangelog } = useInterfaceStore.getState();
	const [{ changelog }] = useFeatureFlags();
	const scroller = useScroller();

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
		<Box className={classes.root}>
			<Box className={classes.primary}>
				<ActionButton
					label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
					onClick={toggleSidebarMode}
					size="md"
				>
					<Icon path={iconSidebar} />
				</ActionButton>

				<Box
					className={classes.breadcrumbs}
					{...scroller.fadeProps}
				>
					<UnstyledButton
						className={classes.scrollerControl}
						data-position="start"
						data-hidden={!scroller.canScrollStart || undefined}
						aria-label="Scroll breadcrumbs left"
						tabIndex={scroller.canScrollStart ? 0 : -1}
						onClick={scroller.scrollStart}
					>
						<Icon path={iconChevronLeft} />
					</UnstyledButton>

					<Box
						ref={scroller.ref}
						className={classes.scroller}
						data-dragging={scroller.isDragging || undefined}
						{...scroller.dragHandlers}
					>
						<Box className={classes.scrollerContent}>
							<ToolbarBreadcrumbs />
						</Box>
					</Box>

					<UnstyledButton
						className={classes.scrollerControl}
						data-position="end"
						data-hidden={!scroller.canScrollEnd || undefined}
						aria-label="Scroll breadcrumbs right"
						tabIndex={scroller.canScrollEnd ? 0 : -1}
						onClick={scroller.scrollEnd}
					>
						<Icon path={iconChevronRight} />
					</UnstyledButton>
				</Box>
			</Box>

			<Box className={classes.secondary}>
				{toolbarInset && <Box className={classes.inset}>{toolbarInset}</Box>}

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
			</Box>
		</Box>
	);
}
