import { Drawer, Group, Tabs, Text } from "@mantine/core";
import { Icon, iconClose, iconTune } from "@surrealdb/ui";
import { useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Spacer } from "~/components/Spacer";
import { CloudInstance, CloudOrganization } from "~/types";
import { ConfigurationCapabilities } from "./configs/capabilities";
import { ImportExport } from "./configs/import-export";
import { ConfigurationNetwork } from "./configs/network";
import { ConfigurationVersion } from "./configs/version";
import classes from "./style.module.scss";

export interface ConfiguratorDrawerProps {
	opened: boolean;
	tab: string;
	organisation: CloudOrganization;
	instance: CloudInstance;
	onChangeTab: (tab: string) => void;
	onUpdate: (version: string) => void;
	onClose: () => void;
}

export function ConfiguratorDrawer({
	opened,
	tab,
	organisation,
	instance,
	onChangeTab,
	onUpdate,
	onClose,
}: ConfiguratorDrawerProps) {
	const [width, setWidth] = useState(650);

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

			<Group p="xl">
				<Group>
					<Icon
						path={iconTune}
						size="lg"
					/>
					<Text
						fw={700}
						fz="xl"
						c="bright"
					>
						Manage instance
					</Text>
				</Group>

				<Spacer />

				<ActionButton
					label="Close drawer"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionButton>
			</Group>

			<Tabs
				variant="gradient"
				value={tab}
				className={classes.drawerTabs}
				onChange={onChangeTab as any}
				flex={1}
			>
				<div
					style={{
						padding: "0 1rem",
					}}
				>
					<Tabs.List
						mb="xl"
						grow
					>
						<Tabs.Tab
							value="capabilities"
							py="sm"
						>
							Capabilities
						</Tabs.Tab>
						<Tabs.Tab
							value="version"
							py="sm"
						>
							Version
						</Tabs.Tab>
						{organisation.privatelink_enabled && (
							<Tabs.Tab
								value="network"
								py="sm"
							>
								Network
							</Tabs.Tab>
						)}
						<Tabs.Tab
							value="import-export"
							py="sm"
						>
							Import & Export
						</Tabs.Tab>
					</Tabs.List>
				</div>

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

				{organisation.privatelink_enabled && (
					<Tabs.Panel value="network">
						<ConfigurationNetwork
							instance={instance}
							onClose={onClose}
						/>
					</Tabs.Panel>
				)}

				<Tabs.Panel value="import-export">
					<ImportExport
						instance={instance}
						onClose={onClose}
					/>
				</Tabs.Panel>
			</Tabs>
		</Drawer>
	);
}
