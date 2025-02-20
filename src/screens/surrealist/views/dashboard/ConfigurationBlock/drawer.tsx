import classes from "./style.module.scss";

import { Drawer, Group, Tabs } from "@mantine/core";
import { useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { CloudInstance } from "~/types";
import { iconClose, iconTune } from "~/util/icons";
import { ConfigurationInstanceType } from "./configs/type";
import { ConfigurationComputeNodes } from "./configs/compute";
import { ConfigurationVersion } from "./configs/version";
import { ConfigurationStorage } from "./configs/storage";
import { ConfigurationCapabilities } from "./configs/capabilities";

export interface ConfigurationDrawerProps {
	opened: boolean;
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationDrawer({ opened, instance, onClose }: ConfigurationDrawerProps) {
	const [width, setWidth] = useState(650);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size={width}
			padding={0}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
			/>

			<Group
				gap="sm"
				p="xl"
			>
				<PrimaryTitle>
					<Icon
						left
						path={iconTune}
						size="sm"
					/>
					Instance configuration
				</PrimaryTitle>

				<Spacer />

				<ActionButton
					label="Close drawer"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionButton>
			</Group>

			<Tabs
				defaultValue="capabilities"
				className={classes.drawerTabs}
				flex={1}
			>
				<Tabs.List
					grow
					mb="xl"
					mx="xl"
				>
					<Tabs.Tab value="capabilities">Capabilities</Tabs.Tab>
					<Tabs.Tab value="version">Version</Tabs.Tab>
					<Tabs.Tab value="type">Instance type</Tabs.Tab>
					<Tabs.Tab value="nodes">Compute nodes</Tabs.Tab>
					<Tabs.Tab value="storage">Storage</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="capabilities">
					<ConfigurationCapabilities
						instance={instance}
						onClose={onClose}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="version">
					<ConfigurationVersion
						instance={instance}
						onClose={onClose}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="type">
					<ConfigurationInstanceType
						instance={instance}
						onClose={onClose}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="nodes">
					<ConfigurationComputeNodes
						instance={instance}
						onClose={onClose}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="storage">
					<ConfigurationStorage
						instance={instance}
						onClose={onClose}
					/>
				</Tabs.Panel>
			</Tabs>
		</Drawer>
	);
}
