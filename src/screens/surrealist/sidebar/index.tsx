import {
	type BoxProps,
	Flex,
	Group,
	Image,
	ScrollArea,
	Stack,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconCog, iconHelp, iconSearch, iconSidebar, pictoSurrealist } from "@surrealdb/ui";
import clsx from "clsx";
import { useCloudUnreadConversationsQuery } from "~/cloud/queries/context";
import { ActionButton } from "~/components/ActionButton";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { useLogoUrl } from "~/hooks/brand";
import { useSetting } from "~/hooks/config";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { isMobile } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import classes from "../style.module.scss";
import { SidebarTarget, useSidebar } from "./portal";

export interface SurrealistSidebarProps extends BoxProps {
	/** Force the sidebar to fill its container, used by the mobile overlay */
	fill?: boolean;
}

export function SurrealistSidebar({ className, fill, ...other }: SurrealistSidebarProps) {
	const logoUrl = useLogoUrl();
	const [, navigate] = useAbsoluteLocation();
	const { mode, setLocation } = useSidebar();
	const [, setSidebarMode] = useSetting("appearance", "sidebarMode");

	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const { data: unreadConversations } = useCloudUnreadConversationsQuery();
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const openSettings = useStable(() => dispatchIntent("open-settings"));
	const openCommands = useStable(() => dispatchIntent("open-command-palette"));

	const toggleMode = useStable(() => {
		setSidebarMode(mode === "compact" ? "wide" : "compact");
	});

	const isCompact = !fill && mode === "compact";

	const goHome = useStable(() => {
		setLocation("/");
		setOverlaySidebar(false);
	});

	const toggleButton = (
		<ActionButton
			label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
			onClick={toggleMode}
		>
			<Icon path={iconSidebar} />
		</ActionButton>
	);

	const logoButton = (
		<UnstyledButton onClick={goHome}>
			<Group
				gap="xs"
				wrap="nowrap"
				align="center"
				style={{ flexShrink: 0 }}
			>
				<Image
					my={-9}
					src={pictoSurrealist}
					w={34}
					className={classes.hat}
				/>
				{!isCompact && (
					<Image
						src={logoUrl}
						style={{ flexShrink: 0 }}
						w={115}
					/>
				)}
			</Group>
		</UnstyledButton>
	);

	return (
		<ScrollArea
			scrollbars="y"
			type="never"
			pos="fixed"
			component="aside"
			top={0}
			left={0}
			bottom={0}
			className={clsx(
				classes.sidebar,
				isCompact && classes.sidebarCollapsed,
				fill && classes.sidebarFill,
				className,
			)}
			{...other}
		>
			<Flex
				className={classes.sidebarInner}
				direction="column"
				px={16}
				pt={14}
			>
				{isCompact ? (
					<Stack
						gap="sm"
						mb="xl"
						align="center"
					>
						{toggleButton}
					</Stack>
				) : (
					<Group
						justify="space-between"
						wrap="nowrap"
						mb="xl"
					>
						{logoButton}
						{toggleButton}
					</Group>
				)}

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
						withTooltip={isCompact}
					/>

					<NavigationIcon
						name="Support"
						icon={iconHelp}
						match={["/support", "/support/*"]}
						onClick={() => navigate("/support")}
						withTooltip={isCompact}
						indicator={unreadConversations}
					/>

					<NavigationIcon
						name="Settings"
						icon={iconCog}
						onClick={openSettings}
						withTooltip={isCompact}
						indicator={!!availableUpdate}
					/>
				</Stack>
			</Flex>
		</ScrollArea>
	);
}
