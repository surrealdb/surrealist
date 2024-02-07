import { Modal, Tabs } from "@mantine/core";
import { adapter } from "~/adapter";
import { GeneralTab } from "./tabs/Behavior";
import { LocalDatabaseTab } from "./tabs/LocalDatabase";
import { ModalTitle } from "../ModalTitle";
import { AppearanceTab } from "./tabs/Appearance";

export interface SettingsProps {
	opened: boolean;
	onClose: () => void;
}

export function Settings(props: SettingsProps) {
	return (
		<>
			<Modal
				opened={props.opened}
				onClose={props.onClose}
				size={580}
				title={<ModalTitle>Settings</ModalTitle>}
			>
				<Tabs defaultValue="general">
					<Tabs.List mb="md" grow>
						<Tabs.Tab value="general">Behavior</Tabs.Tab>
						<Tabs.Tab value="appearance">Appearance</Tabs.Tab>

						{adapter.isServeSupported && <Tabs.Tab value="database">Local database</Tabs.Tab>}
					</Tabs.List>

					<Tabs.Panel value="general" pt="xs">
						<GeneralTab onClose={props.onClose} />
					</Tabs.Panel>

					<Tabs.Panel value="appearance" pt="xs">
						<AppearanceTab />
					</Tabs.Panel>

					<Tabs.Panel value="database" pt="xs">
						<LocalDatabaseTab />
					</Tabs.Panel>
				</Tabs>
			</Modal>
		</>
	);
}
