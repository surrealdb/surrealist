import {
	type BoxProps,
	Flex,
	Group,
	Image,
	ScrollArea,
	Stack,
	UnstyledButton,
} from "@mantine/core";
import { iconCog, iconHelp, iconSearch, pictoSurrealist } from "@surrealdb/ui";
import clsx from "clsx";
import { useCloudUnreadConversationsQuery } from "~/cloud/queries/context";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { useLogoUrl } from "~/hooks/brand";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { isMobile } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import classes from "../style.module.scss";
import { SidebarTarget, useSidebar } from "./portal";

export interface SurrealistSidebarProps extends BoxProps {
	sidebarMode: string;
}

export function SurrealistSidebar({ className, ...other }: SurrealistSidebarProps) {
	const logoUrl = useLogoUrl();
	const [, navigate] = useAbsoluteLocation();
	const { sidebarMode, canHoverSidebar, onHoverEnter, setLocation } = useSidebar();

	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const { data: unreadConversations } = useCloudUnreadConversationsQuery();
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const openSettings = useStable(() => dispatchIntent("open-settings"));
	const openCommands = useStable(() => dispatchIntent("open-command-palette"));

	const isHoverable = sidebarMode === "expandable" && canHoverSidebar;
	const isCollapsed = sidebarMode === "compact" || sidebarMode === "expandable";
	const isFilled = sidebarMode === "fill";

	return (
		<ScrollArea
			scrollbars="y"
			type="never"
			pos="fixed"
			component="aside"
			top={0}
			left={0}
			bottom={0}
			bg="var(--mantine-color-body)"
			onMouseEnter={onHoverEnter}
			className={clsx(
				classes.sidebar,
				isHoverable && classes.sidebarHoverable,
				isCollapsed && classes.sidebarCollapsed,
				isFilled && classes.sidebarFill,
				className,
			)}
			{...other}
		>
			<Flex
				className={classes.sidebarInner}
				direction="column"
				px={16}
			>
				<UnstyledButton
					mb="xl"
					onClick={() => {
						setLocation("/overview");
						setOverlaySidebar(false);
					}}
				>
					<Group
						gap="lg"
						wrap="nowrap"
						align="center"
						style={{ flexShrink: 0 }}
					>
						<Image
							my={-9}
							src={pictoSurrealist}
							w={42}
							className={classes.hat}
						/>
						<Image
							src={logoUrl}
							style={{ flexShrink: 0 }}
							w={118}
						/>
					</Group>
				</UnstyledButton>

				<SidebarTarget />

				<Stack
					gap="sm"
					mt={22}
					pb={18}
				>
					<NavigationIcon
						name={
							<Group wrap="nowrap">
								Search
								{!isMobile() && <Shortcut value={["mod", "K"]} />}
							</Group>
						}
						icon={iconSearch}
						onClick={openCommands}
						onMouseEnter={onHoverEnter}
						withTooltip={sidebarMode === "compact"}
					/>

					<NavigationIcon
						name="Support"
						icon={iconHelp}
						match={["/support", "/support/*"]}
						onClick={() => navigate("/support")}
						onMouseEnter={onHoverEnter}
						withTooltip={sidebarMode === "compact"}
						indicator={unreadConversations}
					/>

					<NavigationIcon
						name="Settings"
						icon={iconCog}
						onClick={openSettings}
						onMouseEnter={onHoverEnter}
						withTooltip={sidebarMode === "compact"}
						indicator={!!availableUpdate}
					/>
				</Stack>
			</Flex>
		</ScrollArea>
	);
}
