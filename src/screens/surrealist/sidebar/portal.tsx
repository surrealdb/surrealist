import { Box, Collapse, Divider, type IndicatorProps, Menu, Stack, Text } from "@mantine/core";
import { Icon, iconArrowLeft, iconChevronDown } from "@surrealdb/ui";
import {
	createContext,
	Fragment,
	type PropsWithChildren,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { Entry } from "~/components/Entry";
import { NavigationIcon } from "~/components/NavigationIcon";
import navClasses from "~/components/NavigationIcon/style.module.scss";
import { useBoolean } from "~/hooks/boolean";
import { useAbsoluteLocation, useRouteMatcher } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { SidebarMode } from "~/types";

/**
 * A sidebar entry which directly navigates to a single destination.
 */
export interface SidebarLink {
	name: string;
	icon: string;
	match?: string[];
	disabled?: boolean;
	indicator?: boolean | IndicatorProps;
	onClick: () => void;
}

/**
 * A single destination nested within a {@link SidebarGroup}.
 * Sub entries never feature an icon of their own.
 */
export interface SidebarSubLink {
	name: string;
	match?: string[];
	disabled?: boolean;
	onClick: () => void;
}

/**
 * A sidebar entry which does not navigate anywhere itself, but instead
 * reveals a list of sub entries when interacted with.
 */
export interface SidebarGroup {
	name: string;
	icon: string;
	items: SidebarSubLink[];
}

/**
 * A top level sidebar entry, either a direct link or a group of sub links.
 */
export type SidebarEntry = SidebarLink | SidebarGroup;

/**
 * Type guard distinguishing groups from plain links.
 */
export function isSidebarGroup(entry: SidebarEntry): entry is SidebarGroup {
	return "items" in entry;
}

interface SidebarContextValue {
	target: HTMLDivElement | null;
	setTarget: (el: HTMLDivElement | null) => void;
	mode: SidebarMode;
	setLocation: (path: string) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
	target: null,
	setTarget: () => {},
	mode: "wide",
	setLocation: () => {},
});

export function useSidebar() {
	return useContext(SidebarContext);
}

export interface SidebarProviderProps extends PropsWithChildren {
	mode: SidebarMode;
}

export function SidebarProvider({ mode, children }: SidebarProviderProps) {
	const [target, setTarget] = useState<HTMLDivElement | null>(null);
	const [, navigate] = useAbsoluteLocation();

	const setLocation = useStable((location: string) => {
		navigate(location);
	});

	const value: SidebarContextValue = {
		target,
		setTarget,
		mode,
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
	items: SidebarEntry[][];
	backButton?: {
		name: ReactNode;
		onClick: () => void;
	};
}

export function SidebarNavigation({ items, backButton }: SidebarNavigationProps) {
	const { mode } = useSidebar();
	const isLight = useIsLight();

	const dividerColor = isLight ? "obsidian.2" : "obsidian.7";

	return (
		<>
			{backButton && (
				<>
					<NavigationIcon
						name={backButton.name}
						icon={iconArrowLeft}
						onClick={backButton.onClick}
						withTooltip={mode === "compact"}
					/>
					<Divider color={dividerColor} />
				</>
			)}
			{items.map((group, i) => (
				<Fragment key={i}>
					{group.map((entry) => (
						<SidebarEntryView
							key={entry.name}
							entry={entry}
						/>
					))}
					{i < items.length - 1 && <Divider color={dividerColor} />}
				</Fragment>
			))}
		</>
	);
}

function SidebarEntryView({ entry }: { entry: SidebarEntry }) {
	const { mode } = useSidebar();

	if (isSidebarGroup(entry)) {
		return mode === "compact" ? <CompactGroup group={entry} /> : <WideGroup group={entry} />;
	}

	return (
		<NavigationIcon
			name={entry.name}
			icon={entry.icon}
			match={entry.match}
			indicator={entry.indicator}
			disabled={entry.disabled}
			onClick={entry.onClick}
			withTooltip={mode === "compact"}
		/>
	);
}

/**
 * A group rendered while the sidebar is compact. The top level icon opens
 * a menu listing the sub entries, labelled with the group name.
 */
function CompactGroup({ group }: { group: SidebarGroup }) {
	const matches = useMemo(() => group.items.flatMap((item) => item.match ?? []), [group.items]);

	return (
		<Menu
			position="right-start"
			offset={14}
			trigger="click-hover"
			openDelay={150}
			transitionProps={{ transition: "scale-x" }}
		>
			<Menu.Target>
				<Box w="100%">
					<NavigationIcon
						name={group.name}
						icon={group.icon}
						match={matches}
						onClick={() => {}}
						withTooltip={false}
					/>
				</Box>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>{group.name}</Menu.Label>
				{group.items.map((item) => (
					<CompactSubItem
						key={item.name}
						item={item}
					/>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

function CompactSubItem({ item }: { item: SidebarSubLink }) {
	const active = useRouteMatcher(item.match ?? []);

	return (
		<Menu.Item
			disabled={item.disabled}
			variant={active ? "gradient" : undefined}
			onClick={item.onClick}
		>
			{item.name}
		</Menu.Item>
	);
}

/**
 * A group rendered while the sidebar is wide. The top level entry shows a
 * chevron and expands inline to reveal its sub entries when clicked.
 */
function WideGroup({ group }: { group: SidebarGroup }) {
	const matches = useMemo(() => group.items.flatMap((item) => item.match ?? []), [group.items]);
	const active = useRouteMatcher(matches);
	const [opened, openHandle] = useBoolean(active);

	useEffect(() => {
		if (active) {
			openHandle.open();
		}
	}, [active]);

	return (
		<Box>
			<Entry
				className={navClasses.viewButton}
				onClick={openHandle.toggle}
				leftSection={
					<Icon
						path={group.icon}
						size="lg"
					/>
				}
				rightSection={
					<Icon
						path={iconChevronDown}
						size="sm"
						style={{
							transform: opened ? undefined : "rotate(-90deg)",
							transition: "transform .15s ease",
						}}
					/>
				}
			>
				<Text
					truncate
					inherit
					span
					lh="normal"
				>
					{group.name}
				</Text>
			</Entry>
			<Collapse expanded={opened}>
				<Stack
					gap="xs"
					mt="xs"
				>
					{group.items.map((item) => (
						<WideSubEntry
							key={item.name}
							item={item}
						/>
					))}
				</Stack>
			</Collapse>
		</Box>
	);
}

function WideSubEntry({ item }: { item: SidebarSubLink }) {
	const active = useRouteMatcher(item.match ?? []);

	return (
		<Entry
			compact
			isActive={active}
			disabled={item.disabled}
			onClick={item.onClick}
			pl={42}
		>
			<Text
				truncate
				inherit
				span
				lh="normal"
				fw={500}
			>
				{item.name}
			</Text>
		</Entry>
	);
}
