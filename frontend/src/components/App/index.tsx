import { Global, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { useStoreValue } from "~/store";
import { useSurrealistTheme } from "~/util/theme";
import { Scaffold } from "../Scaffold";

export function App() {
	const colorScheme = useStoreValue(state => state.colorScheme);
	const mantineTheme = useSurrealistTheme(colorScheme);

	return (
		<MantineProvider
			withGlobalStyles
			withNormalizeCSS
			withCSSVariables
			theme={mantineTheme}
		>
			<ModalsProvider>
				<Scaffold />
			</ModalsProvider>

			<Global
				styles={{
					'body': {
						backgroundColor: '#F4F5FB',
						fontWeight: 500
					}
				}}
			/>
		</MantineProvider>
	)
}