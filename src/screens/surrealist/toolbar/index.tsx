import { Box, UnstyledButton } from "@mantine/core";
import { Icon, iconChevronLeft, iconChevronRight, iconSidebar } from "@surrealdb/ui";
import { ActionButton } from "~/components/ActionButton";
import { useSetting } from "~/hooks/config";
import { useIsDesktop } from "~/hooks/responsive";
import { useScroller } from "~/hooks/scroller";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { ToolbarBreadcrumbs } from "../components/ToolbarBreadcrumbs";
import { ToolbarActions } from "./actions";
import classes from "./style.module.scss";

export function SurrealistToolbar() {
	const scroller = useScroller();

	const toolbarInset = useInterfaceStore((s) => s.toolbarInset);

	const [sidebarMode, setSidebarMode] = useSetting("appearance", "sidebarMode");

	const isDesktop = useIsDesktop();

	const toggleSidebarMode = useStable(() => {
		setSidebarMode(sidebarMode === "compact" ? "wide" : "compact");
	});

	const isCompact = sidebarMode === "compact";

	return (
		<Box className={classes.root}>
			{isDesktop && (
				<ActionButton
					className={classes.sidebarToggle}
					label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
					onClick={toggleSidebarMode}
					size="md"
				>
					<Icon path={iconSidebar} />
				</ActionButton>
			)}

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

			{(toolbarInset || isDesktop) && (
				<Box
					className={classes.trailing}
					data-has-inset={toolbarInset ? true : undefined}
				>
					{toolbarInset && <Box className={classes.inset}>{toolbarInset}</Box>}

					{toolbarInset && <Box className={classes.spacer} />}

					{isDesktop && <ToolbarActions />}
				</Box>
			)}
		</Box>
	);
}
