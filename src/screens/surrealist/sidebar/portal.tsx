import { Divider, Group, Stack } from "@mantine/core";
import { iconArrowLeft } from "@surrealdb/ui";
import {
	createContext,
	Fragment,
	type PropsWithChildren,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { NavigationIcon } from "~/components/NavigationIcon";
import { useBoolean } from "~/hooks/boolean";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { SidebarMode } from "~/types";

export interface NavigationItem {
	name: string;
	icon: string;
	match: string[];
	navigate: () => void;
}

interface SidebarContextValue {
	target: HTMLDivElement | null;
	setTarget: (el: HTMLDivElement | null) => void;
	sidebarMode: SidebarMode;
	canHoverSidebar: boolean;
	onHoverEnter: () => void;
	onHoverClose: () => void;
	setLocation: (path: string) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
	target: null,
	setTarget: () => {},
	sidebarMode: "wide",
	canHoverSidebar: true,
	onHoverEnter: () => {},
	onHoverClose: () => {},
	setLocation: () => {},
});

export function useSidebar() {
	return useContext(SidebarContext);
}

export interface SidebarProviderProps extends PropsWithChildren {
	sidebarMode: SidebarMode;
}

export function SidebarProvider({ sidebarMode, children }: SidebarProviderProps) {
	const [target, setTarget] = useState<HTMLDivElement | null>(null);
	const [canHoverSidebar, hoverSidebarHandle] = useBoolean(true);
	const [, navigate] = useAbsoluteLocation();

	const setLocation = useStable((location: string) => {
		hoverSidebarHandle.close();
		navigate(location);
	});

	const value: SidebarContextValue = {
		target,
		setTarget,
		sidebarMode,
		canHoverSidebar,
		onHoverEnter: hoverSidebarHandle.open,
		onHoverClose: hoverSidebarHandle.close,
		setLocation,
	};

	return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function SidebarTarget() {
	const { setTarget } = useSidebar();

	const ref = useCallback(
		(node: HTMLDivElement | null) => {
			setTarget(node);
		},
		[setTarget],
	);

	return (
		<Stack
			gap="sm"
			component="nav"
			flex={1}
			ref={ref}
		/>
	);
}

export function SidebarPortal({ children }: PropsWithChildren) {
	const { target } = useSidebar();

	if (!target) return null;

	return createPortal(children, target);
}

export interface SidebarNavigationProps {
	items: NavigationItem[][];
	backButton?: {
		name: ReactNode;
		onClick: () => void;
	};
}

export function SidebarNavigation({ items, backButton }: SidebarNavigationProps) {
	const { sidebarMode, onHoverEnter } = useSidebar();
	const isLight = useIsLight();

	return (
		<>
			{backButton && (
				<>
					<NavigationIcon
						name={backButton.name}
						icon={iconArrowLeft}
						onClick={backButton.onClick}
						onMouseEnter={onHoverEnter}
						withTooltip={sidebarMode === "compact"}
					/>
					<Divider color={isLight ? "obsidian.2" : "obsidian.7"} />
				</>
			)}
			{items.map((group, i) => (
				<Fragment key={i}>
					{group.map((info) => (
						<Group
							key={info.name}
							gap="lg"
							wrap="nowrap"
						>
							<NavigationIcon
								name={info.name}
								icon={info.icon}
								match={info.match}
								onClick={info.navigate}
								onMouseEnter={onHoverEnter}
								withTooltip={sidebarMode === "compact"}
							/>
						</Group>
					))}
					{i < items.length - 1 && (
						<Divider color={isLight ? "obsidian.2" : "obsidian.7"} />
					)}
				</Fragment>
			))}
		</>
	);
}
