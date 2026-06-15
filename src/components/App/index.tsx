import { adapter } from "~/adapter";
import { useIsDesktop } from "~/hooks/responsive";
import { DesignerProvider } from "~/providers/Designer";
import { InspectorProvider } from "~/providers/Inspector";
import { SurrealistScreen } from "~/screens/surrealist";
import { Scaffold } from "../Scaffold";
import { Globals } from "./globals";
import { ChangelogModal } from "./modals/changelog";
import { CloudUpdateRequiredDialog } from "./modals/cloud-update-required";
import { CommandPaletteModal } from "./modals/commands";
import { ConnectionsModal } from "./modals/connections";
import { ConsoleDrawer } from "./modals/console";
import { CreateMessageModal } from "./modals/create-message";
import { DataExportModal } from "./modals/data-export";
import { DataImportModal } from "./modals/data-import";
import { DocumentationModal } from "./modals/documentation";
import { FailedConnectDialog } from "./modals/failed-connect";
import { HighlightToolModal } from "./modals/highlight-tool";
import { NewsFeedDrawer } from "./modals/newsfeed";
import { RegisterUserModal } from "./modals/register";
import { SandboxModal } from "./modals/sandbox";
import { SidekickDrawer } from "./modals/sidekick";
import { AccessSignupModal } from "./modals/signup";
import { HelpSearchModal } from "./modals/support-center";
import { TableCreatorModal } from "./modals/table";
import { UpdateModal } from "./modals/updater";
import { Settings } from "./settings";

function Surrealist() {
	return (
		<InspectorProvider>
			<DesignerProvider>
				<SurrealistScreen />
			</DesignerProvider>
		</InspectorProvider>
	);
}

export function App() {
	const isDesktop = useIsDesktop();

	return (
		<Scaffold authentication>
			<Globals />

			<Surrealist />

			<Settings />

			<ConnectionsModal />
			<CommandPaletteModal />
			<DocumentationModal />
			<HelpSearchModal />
			<ChangelogModal />
			<SandboxModal />
			<AccessSignupModal />
			<TableCreatorModal />
			<HighlightToolModal />
			<DataExportModal />
			<DataImportModal />
			<RegisterUserModal />
			<ConsoleDrawer />
			{isDesktop && <NewsFeedDrawer />}
			{isDesktop && <SidekickDrawer />}
			<CreateMessageModal />
			<CloudUpdateRequiredDialog />
			<FailedConnectDialog />

			{adapter.isUpdateCheckSupported && <UpdateModal />}
		</Scaffold>
	);
}
