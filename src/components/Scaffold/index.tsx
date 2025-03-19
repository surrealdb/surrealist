import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContextMenuProvider } from "mantine-contextmenu";
import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useIsLight, useThemePreference } from "~/hooks/theme";
import { CommandsProvider } from "~/providers/Commands";
import { ConfirmationProvider } from "~/providers/Confirmation";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { MANTINE_THEME } from "~/util/mantine";
import { ScaffoldErrorHandler } from "./error";
import { GoogleAnalyticsProvider } from "~/providers/GoogleAnalytics";

const QUERY_CLIENT = new QueryClient();

export function Scaffold({ children }: PropsWithChildren) {
	const isLight = useIsLight();
	const colorScheme = useThemePreference();

	return (
		<GoogleAnalyticsProvider>
			<FeatureFlagsProvider>
				<QueryClientProvider client={QUERY_CLIENT}>
					<MantineProvider
						withCssVariables
						theme={MANTINE_THEME}
						forceColorScheme={colorScheme}
					>
						<Notifications containerWidth={400} />

						<ErrorBoundary
							FallbackComponent={ScaffoldErrorHandler}
							onReset={() => location.reload()}
						>
							<ContextMenuProvider
								borderRadius="md"
								shadow={isLight ? "xs" : "0 6px 12px 2px rgba(0, 0, 0, 0.25)"}
								submenuDelay={250}
							>
								<ConfirmationProvider>
									<ModalsProvider>
										<CommandsProvider>{children}</CommandsProvider>
									</ModalsProvider>
								</ConfirmationProvider>
							</ContextMenuProvider>
						</ErrorBoundary>
					</MantineProvider>
				</QueryClientProvider>
			</FeatureFlagsProvider>
		</GoogleAnalyticsProvider>
	);
}
