import { Stack, Switch, Select, ColorScheme } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { DesignerLayoutMode, DesignerNodeMode } from "~/types";
import { Setting } from "../setting";
import { DESIGNER_LAYOUT_MODES, DESIGNER_NODE_MODES } from "~/constants";
import { useConfigStore } from "~/stores/config";

const THEMES = [
	{ label: "Automatic", value: "automatic" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export function AppearanceTab() {
	const setColorScheme = useConfigStore((s) => s.setColorScheme);
	const setWordWrap = useConfigStore((s) => s.setWordWrap);
	const setSessionSearch = useConfigStore((s) => s.setSessionSearch);
	const setDesignerLayoutMode = useConfigStore((s) => s.setDesignerLayoutMode);
	const setDesignerNodeMode = useConfigStore((s) => s.setDesignerNodeMode);

	const theme = useConfigStore((s) => s.theme);
	const wordWrap = useConfigStore((s) => s.wordWrap);
	const tabSearch = useConfigStore((s) => s.tabSearch);
	const defaultDesignerLayoutMode = useConfigStore((s) => s.defaultDesignerLayoutMode);
	const defaultDesignerNodeMode = useConfigStore((s) => s.defaultDesignerNodeMode);

	const updateColorScheme = useStable((scheme: ColorScheme) => {
		setColorScheme(scheme);
	});
	
	const updateWordWrap = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setWordWrap(e.target.checked);
	});

	const updateTabSearch = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setSessionSearch(e.target.checked);
	});

	const updateLayoutMode = useStable((mode: DesignerLayoutMode) => {
		setDesignerLayoutMode(mode);
	});

	const updateNodeMode = useStable((mode: DesignerNodeMode) => {
		setDesignerNodeMode(mode);
	});

	return (
		<Stack spacing="xs">
			<Setting label="Wrap query results">
				<Switch checked={wordWrap} onChange={updateWordWrap} />
			</Setting>

			<Setting label="Display session list search">
				<Switch checked={tabSearch} onChange={updateTabSearch} />
			</Setting>

			<Setting label="Interface theme">
				<Select data={THEMES} value={theme} onChange={updateColorScheme} />
			</Setting>

			<Setting label="Default designer layout">
				<Select data={DESIGNER_LAYOUT_MODES} value={defaultDesignerLayoutMode} onChange={updateLayoutMode} />
			</Setting>

			<Setting label="Default designer node appearance">
				<Select data={DESIGNER_NODE_MODES} value={defaultDesignerNodeMode} onChange={updateNodeMode} />
			</Setting>
		</Stack>
	);
}
