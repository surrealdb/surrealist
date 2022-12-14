import { Global, MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { useStoreValue } from "~/store";
import { useSurrealistTheme } from "~/util/theme";
import { Scaffold } from "../Scaffold";

export function App() {
	const colorScheme = useStoreValue(state => state.colorScheme);
	const mantineTheme = useSurrealistTheme(colorScheme);
	const isLight = colorScheme === 'light';

	return (
		<MantineProvider
			withGlobalStyles
			withNormalizeCSS
			withCSSVariables
			theme={mantineTheme}
		>
			<NotificationsProvider
				position="bottom-center"
			>
				<Scaffold />
			</NotificationsProvider>

			<Global
				styles={{
					'body': {
						backgroundColor: isLight ? '#F4F5FB' : '#09090a',
						fontWeight: 500
					}
				}}
			/>
		</MantineProvider>
	)
}