import { isDesktop } from "~/adapter";
import { DesignerProvider } from "~/providers/Designer";
import { InspectorProvider } from "~/providers/Inspector";
import { DatabaseScreen } from "~/screens/database";
import { useConfigStore } from "~/stores/config";
import { StartScreen } from "../../screens/start";
import { Scaffold } from "../Scaffold";
import { Globals } from "./globals";
import { ChangelogModal } from "./modals/changelog";
import { CloudExpiredDialog } from "./modals/cloud-expired";
import { ConnectionModal } from "./modals/connection";
import { ConnectionsModal } from "./modals/connections";
import { ConsoleDrawer } from "./modals/console";
import { DownloadModal } from "./modals/download";
import { EmbedderModal } from "./modals/embedder";
import { HighlightToolModal } from "./modals/highlight-tool";
import { KeymapModal } from "./modals/hotkeys";
import { NewsFeedDrawer } from "./modals/newsfeed";
import { CommandPaletteModal } from "./modals/palette";
import { ProvisioningDialog } from "./modals/provisioning";
import { SandboxModal } from "./modals/sandbox";
import { ScopeSignupModal } from "./modals/signup";
import { TableCreatorModal } from "./modals/table";
import { UpdaterDialog } from "./modals/updater";
import { Settings } from "./settings";

function Surrealist() {
	return (
		<InspectorProvider>
			<DesignerProvider>
				<DatabaseScreen />
			</DesignerProvider>
		</InspectorProvider>
	);
}

export function App() {
	const screen = useConfigStore((s) => s.activeScreen);

	return (
		<Scaffold>
			<Globals />

			{screen === "start" ? <StartScreen /> : <Surrealist />}

			<Settings />

			<ConnectionsModal />
			<CommandPaletteModal />
			<ChangelogModal />
			<ConnectionModal />
			<DownloadModal />
			<EmbedderModal />
			<SandboxModal />
			<ScopeSignupModal />
			<TableCreatorModal />
			<KeymapModal />
			<HighlightToolModal />
			<ConsoleDrawer />
			<NewsFeedDrawer />
			<CloudExpiredDialog />
			<ProvisioningDialog />

			{isDesktop && <UpdaterDialog />}
		</Scaffold>
	);
}
