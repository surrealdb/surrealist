import { Notifications } from "@mantine/notifications";
import { MantineProvider } from "@mantine/core";
import { ErrorBoundary } from "react-error-boundary";
import { MANTINE_THEME } from "~/util/mantine";
import { useIsLight, useThemePreference } from "~/hooks/theme";
import { ContextMenuProvider } from "mantine-contextmenu";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { ConfirmationProvider } from "~/providers/Confirmation";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalsProvider } from "@mantine/modals";
import { PropsWithChildren } from "react";
import { ScaffoldErrorHandler } from "./error";

const QUERY_CLIENT = new QueryClient();

export function Scaffold({ children }: PropsWithChildren) {
	const isLight = useIsLight();
	const colorScheme = useThemePreference();

	return (
		<FeatureFlagsProvider>
			<QueryClientProvider client={QUERY_CLIENT}>
				<MantineProvider
					withCssVariables
					theme={MANTINE_THEME}
					forceColorScheme={colorScheme}
				>
					<Notifications />

					<ModalsProvider>
						<ContextMenuProvider
							borderRadius="md"
							shadow={isLight ? "xs" : "0 6px 12px 2px rgba(0, 0, 0, 0.25)"}
							submenuDelay={250}
						>
							<ConfirmationProvider>
								<ErrorBoundary
									FallbackComponent={ScaffoldErrorHandler}
									onReset={() => location.reload()}
								>
									{children}
								</ErrorBoundary>
							</ConfirmationProvider>
						</ContextMenuProvider>
					</ModalsProvider>
				</MantineProvider>
			</QueryClientProvider>
		</FeatureFlagsProvider>
	);
}
