import classes from "./style.module.scss";

import { Drawer, Group, Tabs } from "@mantine/core";
import { useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { iconClose, iconTune } from "~/util/icons";
import { ConfigurationCapabilities } from "./configs/capabilities";
import { ConfigurationComputeNodes } from "./configs/compute";
import { ConfigurationStorage } from "./configs/storage";
import { ConfigurationInstanceType } from "./configs/type";
import { ConfigurationVersion } from "./configs/version";

export interface ConfiguratorDrawerProps {
	opened: boolean;
	tab: string;
	instance: CloudInstance;
	onChangeTab: (tab: string) => void;
	onUpdate: (version: string) => void;
	onClose: () => void;
}

export function ConfiguratorDrawer({
	opened,
	tab,
	instance,
	onChangeTab,
	onUpdate,
	onClose,
}: ConfiguratorDrawerProps) {
	const [width, setWidth] = useState(650);

	const openTypes = useStable(() => {
		onChangeTab("type");
	});

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
				value={tab}
				className={classes.drawerTabs}
				onChange={onChangeTab as any}
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
					<Tabs.Tab value="disk">Disk size</Tabs.Tab>
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
						onUpdate={onUpdate}
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

				<Tabs.Panel value="disk">
					<ConfigurationStorage
						instance={instance}
						onClose={onClose}
						onUpgrade={openTypes}
					/>
				</Tabs.Panel>
			</Tabs>
		</Drawer>
	);
}
