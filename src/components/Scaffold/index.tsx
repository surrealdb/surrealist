import { Button, Flex, MantineProvider, Portal, v8CssVariablesResolver } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { cleanNotifications, Notifications, useNotifications } from "@mantine/notifications";
import { Icon, iconClose } from "@surrealdb/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContextMenuProvider } from "mantine-contextmenu";
import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useIsLight, useThemePreference } from "~/hooks/theme";
import { AuthProvider } from "~/providers/Auth";
import { CloudProvider } from "~/providers/Cloud";
import { CommandsProvider } from "~/providers/Commands";
import { ConfirmationProvider } from "~/providers/Confirmation";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { SURREALIST_THEME } from "~/util/mantine";
import { ScaffoldErrorHandler } from "./error";

const QUERY_CLIENT = new QueryClient();

function NotificationsContainer() {
	const { notifications } = useNotifications();

	return (
		<Portal>
			<Flex
				pos="fixed"
				bottom="var(--mantine-spacing-md)"
				right="var(--mantine-spacing-md)"
				style={{ zIndex: 400, pointerEvents: "none" }}
				w={400}
				direction="column"
				align="flex-end"
				gap="xs"
			>
				{notifications.length >= 2 && (
					<Button
						onClick={() => cleanNotifications()}
						variant="light"
						color="obsidian"
						size="xs"
						radius="xl"
						leftSection={<Icon path={iconClose} />}
						style={{ pointerEvents: "auto" }}
					>
						Clear all
					</Button>
				)}
				<Notifications
					withinPortal={false}
					containerWidth={400}
					style={{ position: "static", width: "100%", pointerEvents: "auto" }}
				/>
			</Flex>
		</Portal>
	);
}

export interface ScaffoldProps {
	authentication?: boolean;
}

export function Scaffold({ authentication, children }: PropsWithChildren<ScaffoldProps>) {
	const isLight = useIsLight();
	const colorScheme = useThemePreference();

	const inner = (
		<>
			<NotificationsContainer />

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
		</>
	);

	return (
		<FeatureFlagsProvider>
			<QueryClientProvider client={QUERY_CLIENT}>
				<MantineProvider
					cssVariablesResolver={v8CssVariablesResolver}
					theme={SURREALIST_THEME}
					forceColorScheme={colorScheme}
				>
					{authentication ? (
						<AuthProvider>
							<CloudProvider>{inner}</CloudProvider>
						</AuthProvider>
					) : (
						inner
					)}
				</MantineProvider>
			</QueryClientProvider>
		</FeatureFlagsProvider>
	);
}
