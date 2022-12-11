import { Global, MantineProvider } from "@mantine/core";
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
			<Scaffold />

			<Global
				styles={{
					'body': {
						fontWeight: 500
					}
				}}
			/>
		</MantineProvider>
	)
}