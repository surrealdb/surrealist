import { Global, MantineProvider } from "@mantine/core";

import { NotificationsProvider } from "@mantine/notifications";
import { Scaffold } from "../Scaffold";
import { useColorScheme } from "@mantine/hooks";
import { useStoreValue } from "~/store";
import { useSurrealistTheme } from "~/util/theme";

export function App() {
	const colorScheme = useStoreValue(state => state.colorScheme);
	const defaultScheme = useColorScheme();
	const actualTheme = colorScheme == "automatic" ? defaultScheme : colorScheme;
	const mantineTheme = useSurrealistTheme(actualTheme);
	const isLight = actualTheme === 'light';

	return (
		<MantineProvider
			withGlobalStyles
			withNormalizeCSS
			withCSSVariables
			theme={mantineTheme}
		>
			<NotificationsProvider
				position="bottom-right"
			>
				<Scaffold />
			</NotificationsProvider>

			<Global
				styles={{
					'body': {
						backgroundColor: isLight ? '#F4F5FB' : '#09090a',
						fontWeight: 500
					},
					'.__dbk__container': {
						overflow: 'visible'
					}
				}}
			/>

			{/* See https://github.com/microsoft/monaco-editor/issues/2689 */}
			<span style={{ fontFamily: 'JetBrains Mono' }} />
		</MantineProvider>
	)
}