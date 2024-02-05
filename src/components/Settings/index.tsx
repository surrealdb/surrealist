import { Button, Modal, Paper, Stack, Tabs, Text } from "@mantine/core";
import { adapter } from "~/adapter";
import { GeneralTab } from "./tabs/Behavior";
import { ConnectionTab } from "./tabs/Connection";
import { LocalDatabaseTab } from "./tabs/LocalDatabase";
import { useIsLight } from "~/hooks/theme";
import { ModalTitle } from "../ModalTitle";
import { AppearanceTab } from "./tabs/Appearance";

export interface SettingsProps {
	opened: boolean;
	onClose: () => void;
}

export function Settings(props: SettingsProps) {
	const isLight = useIsLight();

	return (
		<>
			<Modal
				opened={props.opened}
				onClose={props.onClose}
				size={580}
				title={<ModalTitle>Settings</ModalTitle>}
			>
				{adapter.isPromotionSupported && (
					<Paper
						mb="xl"
						c="white"
						sx={(theme) => ({
							background: `url(/desktop.png), ${theme.fn.gradient()}`,
							overflow: "hidden",
							backgroundSize: "contain",
							backgroundRepeat: "no-repeat",
							backgroundPosition: "center right",
						})}>
						<Stack spacing="xs" p="md">
							<Text size="xl" weight={600}>
								Surrealist Desktop
							</Text>
							<Text style={{ maxWidth: "80%" }}>
								Download Surrealist for desktop to gain additional features including database running and offline
								support.
							</Text>
							<div>
								<a href="https://github.com/StarlaneStudios/Surrealist/releases" target="_blank">
									<Button color="light.0" variant="outline">
										Download
									</Button>
								</a>
							</div>
						</Stack>
					</Paper>
				)}

				<Tabs defaultValue="general">
					<Tabs.List mb="md" grow>
						<Tabs.Tab value="general">Behavior</Tabs.Tab>
						<Tabs.Tab value="appearance">Appearance</Tabs.Tab>
						<Tabs.Tab value="connection">Connection</Tabs.Tab>

						{adapter.isServeSupported && <Tabs.Tab value="database">Local database</Tabs.Tab>}
					</Tabs.List>

					<Tabs.Panel value="general" pt="xs">
						<GeneralTab onClose={props.onClose} />
					</Tabs.Panel>

					<Tabs.Panel value="appearance" pt="xs">
						<AppearanceTab />
					</Tabs.Panel>

					<Tabs.Panel value="connection" pt="xs">
						<ConnectionTab />
					</Tabs.Panel>

					<Tabs.Panel value="database" pt="xs">
						<LocalDatabaseTab />
					</Tabs.Panel>
				</Tabs>
			</Modal>
		</>
	);
}
