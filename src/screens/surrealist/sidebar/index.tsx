import {
	Box,
	type BoxProps,
	Flex,
	Group,
	Image,
	ScrollArea,
	Stack,
	Transition,
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
	/** Force the sidebar to fill its container, used by the mobile overlay */
	fill?: boolean;
}

export function SurrealistSidebar({ className, fill, ...other }: SurrealistSidebarProps) {
	const logoUrl = useLogoUrl();
	const [, navigate] = useAbsoluteLocation();
	const { mode, setLocation } = useSidebar();

	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const { data: unreadConversations } = useCloudUnreadConversationsQuery();

	const openSettings = useStable(() => dispatchIntent("open-settings"));
	const openCommands = useStable(() => dispatchIntent("open-command-palette"));

	const isCompact = !fill && mode === "compact";

	const goHome = useStable(() => {
		setLocation("/");
	});

	return (
		<Box
			pos="fixed"
			component="aside"
			top={0}
			left={0}
			bottom={0}
			display="flex"
			className={classes.sidebarWrapper}
		>
			<ScrollArea
				scrollbars="y"
				type="never"
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
					pt={12}
				>
					<UnstyledButton
						onClick={goHome}
						className={classes.logo}
						mb="lg"
					>
						<Group
							ml={3}
							gap="sm"
							wrap="nowrap"
							align="center"
							style={{ flexShrink: 0 }}
						>
							<Image
								src={pictoSurrealist}
								w={36}
								className={classes.logoHat}
							/>
							<Transition
								mounted={!isCompact}
								timingFunction="ease-out"
								transition="fade-right"
								duration={150}
							>
								{(style) => (
									<Image
										src={logoUrl}
										style={{ flexShrink: 0, ...style }}
										w={115}
									/>
								)}
							</Transition>
						</Group>
					</UnstyledButton>

					<SidebarTarget />

					<Stack
						gap="sm"
						mt={22}
						pb={18}
					>
						<NavigationIcon
							name="Support"
							icon={iconHelp}
							match={["/support", "/support/*"]}
							onClick={() => navigate("/support")}
							withTooltip={isCompact}
							indicator={unreadConversations}
						/>

						<NavigationIcon
							name="Search"
							rightSection={!isMobile() && <Shortcut value={["mod", "K"]} />}
							icon={iconSearch}
							onClick={openCommands}
							withTooltip={isCompact}
						/>

						<NavigationIcon
							name="Settings"
							rightSection={!isMobile() && <Shortcut value={["mod", ","]} />}
							icon={iconCog}
							onClick={openSettings}
							withTooltip={isCompact}
							indicator={!!availableUpdate}
						/>
					</Stack>
				</Flex>
			</ScrollArea>
		</Box>
	);
}
