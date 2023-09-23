import { Stack, Switch, Select, ColorScheme } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { store, actions } from "~/store";
import { DesignerLayoutMode, DesignerNodeMode, SurrealistConfig } from "~/types";
import { updateConfig } from "~/util/helpers";
import { Setting } from "../setting";
import { DESIGNER_LAYOUT_MODES, DESIGNER_NODE_MODES } from "~/constants";

const THEMES = [
	{ label: "Automatic", value: "automatic" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export interface AppearanceTabProps {
	config: SurrealistConfig;
}

export function AppearanceTab({ config }: AppearanceTabProps) {

	const setColorScheme = useStable((scheme: ColorScheme) => {
		store.dispatch(actions.setColorScheme(scheme));
		updateConfig();
	});
	
	const setWordWrap = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setWordWrap(e.target.checked));
		updateConfig();
	});

	const setTabSearch = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setSessionSearch(e.target.checked));
		updateConfig();
	});

	const setLayoutMode = useStable((mode: DesignerLayoutMode) => {
		store.dispatch(actions.setDesignerLayoutMode(mode));
		updateConfig();
	});

	const setNodeMode = useStable((mode: DesignerNodeMode) => {
		store.dispatch(actions.setDesignerNodeMode(mode));
		updateConfig();
	});

	return (
		<Stack spacing="xs">
			<Setting label="Wrap query results">
				<Switch checked={config.wordWrap} onChange={setWordWrap} />
			</Setting>

			<Setting label="Display session list search">
				<Switch checked={config.tabSearch} onChange={setTabSearch} />
			</Setting>

			<Setting label="Interface theme">
				<Select data={THEMES} value={config.theme} onChange={setColorScheme} />
			</Setting>

			<Setting label="Default designer layout">
				<Select data={DESIGNER_LAYOUT_MODES} value={config.defaultDesignerLayoutMode} onChange={setLayoutMode} />
			</Setting>

			<Setting label="Default designer node appearance">
				<Select data={DESIGNER_NODE_MODES} value={config.defaultDesignerNodeMode} onChange={setNodeMode} />
			</Setting>
		</Stack>
	);
}
