import { Stack, Switch, Select, ColorScheme } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { store } from "~/store";
import { DesignerLayoutMode, DesignerNodeMode, SurrealistConfig } from "~/types";
import { Setting } from "../setting";
import { DESIGNER_LAYOUT_MODES, DESIGNER_NODE_MODES } from "~/constants";
import { setColorScheme, setWordWrap, setSessionSearch, setDesignerLayoutMode, setDesignerNodeMode } from "~/stores/config";

const THEMES = [
	{ label: "Automatic", value: "automatic" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export interface AppearanceTabProps {
	config: SurrealistConfig;
}

export function AppearanceTab({ config }: AppearanceTabProps) {

	const updateColorScheme = useStable((scheme: ColorScheme) => {
		store.dispatch(setColorScheme(scheme));
	});
	
	const updateWordWrap = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setWordWrap(e.target.checked));
	});

	const updateTabSearch = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setSessionSearch(e.target.checked));
	});

	const updateLayoutMode = useStable((mode: DesignerLayoutMode) => {
		store.dispatch(setDesignerLayoutMode(mode));
	});

	const updateNodeMode = useStable((mode: DesignerNodeMode) => {
		store.dispatch(setDesignerNodeMode(mode));
	});

	return (
		<Stack spacing="xs">
			<Setting label="Wrap query results">
				<Switch checked={config.wordWrap} onChange={updateWordWrap} />
			</Setting>

			<Setting label="Display session list search">
				<Switch checked={config.tabSearch} onChange={updateTabSearch} />
			</Setting>

			<Setting label="Interface theme">
				<Select data={THEMES} value={config.theme} onChange={updateColorScheme} />
			</Setting>

			<Setting label="Default designer layout">
				<Select data={DESIGNER_LAYOUT_MODES} value={config.defaultDesignerLayoutMode} onChange={updateLayoutMode} />
			</Setting>

			<Setting label="Default designer node appearance">
				<Select data={DESIGNER_NODE_MODES} value={config.defaultDesignerNodeMode} onChange={updateNodeMode} />
			</Setting>
		</Stack>
	);
}
