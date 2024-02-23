import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Center,
	Stack,
	Tooltip,
} from "@mantine/core";

import clsx from "clsx";
import { useStable } from "~/hooks/stable";
import { Toolbar } from "../Toolbar";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { ConnectionEditor } from "./editor";
import { executeQuery } from "~/database";
import { InPortal, OutPortal, createHtmlPortalNode, HtmlPortalNode } from "react-reverse-portal";
import { QueryView } from "~/views/query/QueryView";
import { ViewMode } from "~/types";
import { ExplorerView } from "~/views/explorer/ExplorerView";
import { DesignerView } from "~/views/designer/DesignerView";
import { AuthenticationView } from "~/views/authentication/AuthenticationView";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { VIEW_MODES } from "~/constants";
import { updateTitle } from "~/util/helpers";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { Settings } from "../Settings";
import { useIsLight } from "~/hooks/theme";
import { themeColor } from "~/util/mantine";
import { iconCog } from "~/util/icons";
import { isDesktop } from "~/adapter";
import { FreshExperience } from "./fresh";

const PORTAL_ATTRS = {
	attributes: {
		style: "height: 100%"
	}
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_ATTRS),
	explorer: createHtmlPortalNode(PORTAL_ATTRS),
	designer: createHtmlPortalNode(PORTAL_ATTRS),
	authentication: createHtmlPortalNode(PORTAL_ATTRS),
};

interface NavigationIconProps {
	name: string;
	isActive?: boolean;
	isLight: boolean;
	icon: string;
	onClick: () => void;
}

function NavigationIcon({ name, isActive, isLight, icon, onClick }: NavigationIconProps) {
	return (
		<Tooltip
			position="right"
			label={name}
			ml="xs"
			transitionProps={{
				transition: "scale-x"
			}}
		>
			<ActionIcon
				color={isActive ? "surreal" : isLight ? "dark.8" : "dark.1"}
				variant={isActive ? "gradient" : "subtle"}
				className={clsx(classes.viewButton, isActive && classes.viewButtonActive)}
				onClick={onClick}
				radius="lg"
			>
				<Icon path={icon} />
			</ActionIcon>
		</Tooltip>	
	);
}

export function Scaffold() {
	const isLight = useIsLight();

	const { setActiveView } = useConfigStore.getState();
	const { title, openConnectionCreator } = useInterfaceStore.getState();

	const activeConnection = useConfigStore((s) => s.activeConnection);
	const activeView = useConfigStore((s) => s.activeView);

	const [showSettings, settingsHandle] = useDisclosure();

	const viewNode = VIEW_PORTALS[activeView];

	const userExecuteQuery = useStable(() => {
		executeQuery({
			loader: true
		});
	});
	
	useHotkeys([
		["F9", () => userExecuteQuery()],
		["mod+Enter", () => userExecuteQuery()],
	]);

	const setViewMode = useStable((id: ViewMode) => {
		updateTitle();
		setActiveView(id);
	});

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight ? themeColor("slate.0") : themeColor("slate.9")
			}}
		>
			{isDesktop && (
				<Center
					data-tauri-drag-region
					className={classes.titlebar}
				>
					{title}
				</Center>
			)}
			
			<Toolbar
				viewMode={activeView}
				onCreateTab={openConnectionCreator}
			/>

			{activeConnection ? (
				<>
					<Box p="sm" className={classes.wrapper}>
						<Stack gap="xs">
							{VIEW_MODES.map((info) => {
								const isActive = info.id === activeView;

								return (
									<NavigationIcon
										key={info.id}
										name={info.name}
										isActive={isActive}
										isLight={isLight}
										icon={info.icon}
										onClick={() => setViewMode(info.id as ViewMode)}
									/>
								);
							})}

							<Spacer />

							<NavigationIcon
								name="Settings"
								isLight={isLight}
								icon={iconCog}
								onClick={settingsHandle.toggle}
							/>
						</Stack>
						<Box className={classes.content}>
							{viewNode && <OutPortal node={viewNode} />}
						</Box>
					</Box>

					<InPortal node={VIEW_PORTALS.query}>
						<QueryView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.explorer}>
						<ExplorerView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.designer}>
						<DesignerView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.authentication}>
						<AuthenticationView />
					</InPortal>
				</>
			) : (
				<FreshExperience />
			)}

			<ConnectionEditor />

			<Settings
				opened={showSettings}
				onClose={settingsHandle.close}
			/>
		</div>
	);
}
