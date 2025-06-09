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
import { iconArrowDownFat, iconClose } from "~/util/icons";
import { ConfigurationStorage } from "../UpgradeDrawer/configs/storage";
import { ConfigurationInstanceType } from "../UpgradeDrawer/configs/type";

export interface UpgradeDrawerProps {
	opened: boolean;
	tab: string;
	instance: CloudInstance;
	onChangeTab: (tab: string) => void;
	onClose: () => void;
}

export function UpgradeDrawer({ opened, tab, instance, onChangeTab, onClose }: UpgradeDrawerProps) {
	const [width, setWidth] = useState(650);

	const openTypes = useStable(() => {
		onChangeTab("type");
	});

	const hideDisk = instance.distributed_storage_specs !== undefined;

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
						style={{
							rotate: "180deg",
						}}
						path={iconArrowDownFat}
						size="sm"
					/>
					Upgrade instance
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
					<Tabs.Tab value="type">Instance type</Tabs.Tab>
					<Tabs.Tab
						value="disk"
						disabled={hideDisk}
					>
						Disk size
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="type">
					<ConfigurationInstanceType
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
