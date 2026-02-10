import { Drawer, Group, Tabs } from "@mantine/core";
import { Icon, iconArrowDownFat, iconClose } from "@surrealdb/ui";
import { useState } from "react";
import { INSTANCE_CATEGORY_PLANS } from "~/cloud/helpers";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization } from "~/types";
import { ConfigurationStorage } from "../UpgradeDrawer/configs/storage";
import { ConfigurationInstanceType } from "../UpgradeDrawer/configs/type";
import { ConfigurationNodes } from "./configs/nodes";
import classes from "./style.module.scss";

export interface UpgradeDrawerProps {
	opened: boolean;
	tab: string;
	instance: CloudInstance;
	organisation: CloudOrganization;
	onChangeTab: (tab: string) => void;
	onClose: () => void;
}

export function UpgradeDrawer({
	opened,
	tab,
	instance,
	organisation,
	onChangeTab,
	onClose,
}: UpgradeDrawerProps) {
	const [width, setWidth] = useState(650);

	const openTypes = useStable(() => {
		onChangeTab("type");
	});

	const guessedPlan = INSTANCE_CATEGORY_PLANS[instance.type.category];

	const isComputeNodesTabVisible = guessedPlan === "scale" || guessedPlan === "enterprise";

	return (
		<Drawer
			withCloseButton={false}
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
						// disabled={hideDisk}
					>
						Storage capacity
					</Tabs.Tab>
					{isComputeNodesTabVisible && (
						<Tabs.Tab value="compute-nodes">Compute nodes</Tabs.Tab>
					)}
				</Tabs.List>

				<Tabs.Panel value="type">
					<ConfigurationInstanceType
						instance={instance}
						organisation={organisation}
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

				{isComputeNodesTabVisible && (
					<Tabs.Panel value="compute-nodes">
						<ConfigurationNodes
							instance={instance}
							onClose={onClose}
						/>
					</Tabs.Panel>
				)}
			</Tabs>
		</Drawer>
	);
}
