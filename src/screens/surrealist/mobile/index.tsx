import { Box, Indicator, Text, UnstyledButton } from "@mantine/core";
import { Icon, iconNewspaper, iconSidebar, iconSidekick } from "@surrealdb/ui";
import { useEffect, useRef } from "react";
import { AccountAvatar } from "~/components/AccountAvatar";
import { NewsfeedList } from "~/components/Newsfeed/list";
import { Sidekick } from "~/components/Sidekick";
import { useActivePage } from "~/hooks/active-page";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useUnreadNewsPosts } from "~/hooks/newsfeed";
import { useAbsoluteLocation, useIntent } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { useFeatureFlags } from "~/util/feature-flags";
import { SurrealistSidebar } from "../sidebar";
import { AccountPanel } from "./account-panel";
import { useBottomCard } from "./sheet";
import classes from "./style.module.scss";

/**
 * The mobile navigation layer: a single bottom card that collapses to a dock
 * (current-view pill + quick actions) and expands into exactly one panel —
 * navigation, account, Sidekick or Newsfeed — via tap or drag.
 */
export function MobileNavigation() {
	const card = useBottomCard();
	const [location] = useAbsoluteLocation();
	const activePage = useActivePage();
	const [flags] = useFeatureFlags();
	const showCloud = useIsCloudEnabled();
	const unread = useUnreadNewsPosts();

	const hasAccount = showCloud && flags.cloud_access;
	const { panel, progress, dragging } = card;

	// Route external open intents into the card
	useIntent("open-sidekick", () => card.setPanel("sidekick"));
	useIntent("open-news", () => card.setPanel("news"));

	// Collapse the card whenever the user navigates
	// biome-ignore lint/correctness/useExhaustiveDependencies: collapse on location change
	useEffect(() => {
		card.collapse();
	}, [location]);

	// Mark news as viewed when leaving the news panel
	const prevPanel = useRef(panel);
	useEffect(() => {
		if (prevPanel.current === "news" && panel !== "news") {
			useConfigStore.getState().updateViewedNews();
		}
		prevPanel.current = panel;
	}, [panel]);

	const transition = dragging ? "none" : undefined;
	const heightStyle =
		card.height !== null
			? `${card.height}px`
			: panel
				? "var(--card-expanded)"
				: "var(--card-dock)";

	return (
		<>
			<Box
				className={classes.backdrop}
				data-active={progress > 0 || undefined}
				style={{ opacity: progress, transition }}
				onClick={card.collapse}
			/>

			<Box
				className={classes.card}
				style={{ height: heightStyle, transition }}
			>
				<Box
					className={classes.handle}
					{...card.getHandleProps()}
				>
					<Box className={classes.grip} />
				</Box>

				<Box className={classes.body}>
					{/* Collapsed dock */}
					<Box
						className={classes.dock}
						style={{
							opacity: 1 - progress,
							transition,
							pointerEvents: progress > 0.5 ? "none" : "auto",
						}}
					>
						<UnstyledButton
							className={classes.pill}
							{...card.getHandleProps()}
						>
							<Icon
								path={activePage?.icon ?? iconSidebar}
								size="lg"
							/>
							<Text className={classes.pillLabel}>{activePage?.name ?? "Menu"}</Text>
						</UnstyledButton>

						<Box className={classes.dockActions}>
							{flags.sidekick_ai && (
								<UnstyledButton
									className={classes.dockAction}
									aria-label="Sidekick AI"
									onClick={() => card.open("sidekick")}
								>
									<Icon
										path={iconSidekick}
										size="lg"
									/>
								</UnstyledButton>
							)}

							{flags.newsfeed && (
								<Indicator
									disabled={unread.length === 0}
									offset={6}
									size={8}
								>
									<UnstyledButton
										className={classes.dockAction}
										aria-label="Latest news"
										onClick={() => card.open("news")}
									>
										<Icon
											path={iconNewspaper}
											size="lg"
										/>
									</UnstyledButton>
								</Indicator>
							)}

							{hasAccount && <AccountAvatar onClick={() => card.open("account")} />}
						</Box>
					</Box>

					{/* Expanded panel */}
					<Box
						className={classes.panel}
						style={{
							opacity: progress,
							transition,
							pointerEvents: progress > 0.5 ? "auto" : "none",
						}}
					>
						{/* Navigation stays mounted so the sidebar portal target persists */}
						<Box
							className={classes.navPanel}
							style={{ display: panel === "nav" ? "flex" : "none" }}
						>
							<SurrealistSidebar
								fill
								pos="static"
								w="100%"
								h="100%"
								pt={0}
							/>
						</Box>

						{panel === "account" && <AccountPanel onAction={card.collapse} />}

						{panel === "sidekick" && (
							<Box className={classes.panelFill}>
								<Sidekick
									inline
									chatPadding={10}
								/>
							</Box>
						)}

						{panel === "news" && (
							<Box className={classes.panelFill}>
								<NewsfeedList />
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		</>
	);
}
