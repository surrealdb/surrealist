import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContextMenuProvider } from "mantine-contextmenu";
import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useIsLight, useThemePreference } from "~/hooks/theme";
import { AuthProvider } from "~/providers/Auth";
import { CommandsProvider } from "~/providers/Commands";
import { ConfirmationProvider } from "~/providers/Confirmation";
import { ContextProvider } from "~/providers/Context";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { SURREALIST_THEME } from "~/util/mantine";
import { ScaffoldErrorHandler } from "./error";

const QUERY_CLIENT = new QueryClient();

export interface ScaffoldProps {
	authentication?: boolean;
}

export function Scaffold({ authentication, children }: PropsWithChildren<ScaffoldProps>) {
	const isLight = useIsLight();
	const colorScheme = useThemePreference();

	const inner = (
		<>
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
							<CommandsProvider>
								<ContextProvider>{children}</ContextProvider>
							</CommandsProvider>
						</ModalsProvider>
					</ConfirmationProvider>
				</ContextMenuProvider>
			</ErrorBoundary>
		</>
	);
	return (
		<FeatureFlagsProvider>
			<QueryClientProvider client={QUERY_CLIENT}>
				<MantineProvider
					withCssVariables
					theme={SURREALIST_THEME}
					forceColorScheme={colorScheme}
				>
					{authentication ? <AuthProvider>{inner}</AuthProvider> : inner}
				</MantineProvider>
			</QueryClientProvider>
		</FeatureFlagsProvider>
	);
}
