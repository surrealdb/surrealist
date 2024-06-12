import { Notifications } from "@mantine/notifications";
import { MantineProvider } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { ErrorBoundary } from "react-error-boundary";
import { MANTINE_THEME } from "~/util/mantine";
import { useColorScheme, useIsLight } from "~/hooks/theme";
import { ContextMenuProvider } from "mantine-contextmenu";
import { InspectorProvider } from "~/providers/Inspector";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { ConfirmationProvider } from "~/providers/Confirmation";
import { useUrlHandler } from "~/hooks/url";
import { AppErrorHandler } from "./error";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";
import { DatabaseScreen } from "~/screens/database";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useModTracker, useWindowSettings } from "./hooks";
import { Settings } from "./settings";
import { StartScreen } from "../../screens/start";
import { ChangelogModal } from "./modals/changelog";
import { ConnectionModal } from "./modals/connection";
import { DownloadModal } from "./modals/download";
import { EmbedderModal } from "./modals/embedder";
import { LegacyModal } from "./modals/legacy";
import { CommandPaletteModal } from "./modals/palette";
import { SandboxModal } from "./modals/sandbox";
import { ScopeSignupModal } from "./modals/signup";
import { TableCreatorModal } from "./modals/table";
import { KeymapModal } from "./modals/hotkeys";
import { UpdaterDialog } from "./modals/updater";
import { isDesktop } from "~/adapter";
import { HighlightToolModal } from "./modals/highlight-tool";

const queryClient = new QueryClient();

export function App() {
	const { setActiveConnection } = useConfigStore.getState();

	const isLight = useIsLight();
	const colorScheme = useColorScheme();
	const screen = useConfigStore((s) => s.activeScreen);

	const handleReset = useStable(() => {
		setActiveConnection(SANDBOX);
	});

	useUrlHandler();
	useModTracker();
	useWindowSettings();

	return (
		<FeatureFlagsProvider>
			<QueryClientProvider client={queryClient}>
				<MantineProvider
					withCssVariables
					theme={MANTINE_THEME}
					forceColorScheme={colorScheme}
				>
					<Notifications />

					<ContextMenuProvider
						borderRadius="md"
						shadow={isLight ? "xs" : "0 6px 12px 2px rgba(0, 0, 0, 0.25)"}
						submenuDelay={250}
					>
						<ConfirmationProvider>
							<InspectorProvider>
								<ErrorBoundary
									FallbackComponent={AppErrorHandler}
									onReset={handleReset}
								>
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
									<LegacyModal />
									<SandboxModal />
									<ScopeSignupModal />
									<TableCreatorModal />
									<KeymapModal />
                  <HighlightToolModal />

									{isDesktop && (
										<UpdaterDialog />
									)}
								</ErrorBoundary>
							</InspectorProvider>
						</ConfirmationProvider>
					</ContextMenuProvider>
				</MantineProvider>
			</QueryClientProvider>
		</FeatureFlagsProvider>
	);
}
