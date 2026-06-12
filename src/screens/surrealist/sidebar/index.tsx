import {
	type BoxProps,
	Divider,
	Image,
	ScrollArea,
	Stack,
	Transition,
	UnstyledButton,
} from "@mantine/core";
import { iconDownload, iconSearch, pictoSurrealistGradient } from "@surrealdb/ui";
import clsx from "clsx";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { useLogoUrl } from "~/hooks/brand";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdateState } from "~/hooks/updater";
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
	// const [, navigate] = useAbsoluteLocation();
	const { mode, setLocation } = useSidebar();

	// const { data: unreadConversations } = useCloudUnreadConversationsQuery();
	const [hasGreeting] = useSetting("appearance", "logoGreetAnimation");
	const { showInNavigation } = useDesktopUpdateState();

	// const openSettings = useStable(() => dispatchIntent("open-settings"));
	const openCommands = useStable(() => dispatchIntent("open-command-palette"));
	const openUpdate = useStable(() => dispatchIntent("open-update"));

	const isCompact = !fill && mode === "compact";

	const goHome = useStable(() => {
		setLocation("/");
	});

	return (
		<Stack
			pos="fixed"
			component="aside"
			gap={0}
			top={0}
			left={0}
			bottom={0}
			className={clsx(classes.sidebar, className)}
			mod={{
				fill,
				isCompact,
			}}
			{...other}
		>
			<Stack
				gap={0}
				px={16}
				pt={12}
			>
				<UnstyledButton
					onClick={goHome}
					className={classes.logo}
					pos="relative"
					h={42}
				>
					<Image
						src={pictoSurrealistGradient}
						w={36}
						className={classes.logoHat}
						pos="absolute"
						top={0}
						left={3}
						mod={{ greet: hasGreeting && !isCompact }}
					/>
					<Transition
						mounted={!isCompact}
						keepMounted
						timingFunction="ease-out"
						transition={hasGreeting ? "scale-x" : "fade-right"}
						duration={150}
					>
						{(style) => (
							<Image
								src={logoUrl}
								style={{ flexShrink: 0, ...style }}
								w={125}
								ml={hasGreeting ? "sm" : 48}
								mt="-xs"
							/>
						)}
					</Transition>
				</UnstyledButton>
			</Stack>

			<ScrollArea
				flex={1}
				scrollbars="y"
				type="never"
				className={classes.sidebarNavigation}
			>
				<Stack
					px={16}
					py="lg"
				>
					<SidebarTarget />
				</Stack>
			</ScrollArea>

			<Stack
				px={16}
				pb={18}
			>
				<Divider />

				{showInNavigation && (
					<NavigationIcon
						name="Update Surrealist"
						icon={iconDownload}
						onClick={openUpdate}
						withTooltip={isCompact}
						className={classes.sidebarUpdate}
					/>
				)}

				<NavigationIcon
					name="Search"
					rightSection={!isMobile() && <Shortcut value={["mod", "K"]} />}
					icon={iconSearch}
					onClick={openCommands}
					withTooltip={isCompact}
				/>
			</Stack>
		</Stack>
	);
}
