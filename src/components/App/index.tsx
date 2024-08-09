import { useConfigStore } from "~/stores/config";
import { DatabaseScreen } from "~/screens/database";
import { Settings } from "./settings";
import { StartScreen } from "../../screens/start";
import { ChangelogModal } from "./modals/changelog";
import { ConnectionModal } from "./modals/connection";
import { DownloadModal } from "./modals/download";
import { EmbedderModal } from "./modals/embedder";
import { CommandPaletteModal } from "./modals/palette";
import { SandboxModal } from "./modals/sandbox";
import { ScopeSignupModal } from "./modals/signup";
import { TableCreatorModal } from "./modals/table";
import { KeymapModal } from "./modals/hotkeys";
import { UpdaterDialog } from "./modals/updater";
import { isDesktop } from "~/adapter";
import { HighlightToolModal } from "./modals/highlight-tool";
import { ConsoleDrawer } from "./modals/console";
import { CloudExpiredDialog } from "./modals/cloud-expired";
import { Scaffold } from "../Scaffold";
import { Globals } from "./globals";

export function App() {
	const screen = useConfigStore((s) => s.activeScreen);

	return (
		<Scaffold>
			<Globals />

			{screen === "start"
				? <StartScreen />
				: <DatabaseScreen />
			}

			<Settings />

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
			<CloudExpiredDialog />

			{isDesktop && (
				<UpdaterDialog />
			)}
		</Scaffold>
	);
}
