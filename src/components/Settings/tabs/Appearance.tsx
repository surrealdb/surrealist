import { Stack, Switch, Select, MantineColorScheme } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { DesignerLayoutMode, DesignerNodeMode } from "~/types";
import { Setting } from "../setting";
import { DESIGNER_LAYOUT_MODES, DESIGNER_NODE_MODES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { useCheckbox } from "~/hooks/events";

const THEMES = [
	{ label: "Automatic", value: "auto" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export function AppearanceTab() {
	const { setColorScheme, setWordWrap, setDesignerLayoutMode, setDesignerNodeMode } = useConfigStore.getState();

	const colorScheme = useConfigStore((s) => s.colorScheme);
	const wordWrap = useConfigStore((s) => s.wordWrap);
	const defaultDesignerLayoutMode = useConfigStore((s) => s.defaultDesignerLayoutMode);
	const defaultDesignerNodeMode = useConfigStore((s) => s.defaultDesignerNodeMode);

	const updateWordWrap = useCheckbox(setWordWrap);

	const updateColorScheme = useStable((value: string | null) => {
		setColorScheme(value as MantineColorScheme || 'light');
	});

	const updateLayoutMode = useStable((mode: string | null) => {
		setDesignerLayoutMode(mode as DesignerLayoutMode || 'diagram');
	});

	const updateNodeMode = useStable((mode: string | null) => {
		setDesignerNodeMode(mode as DesignerNodeMode || 'fields');
	});

	return (
		<Stack gap="xs">
			<Setting label="Wrap query results">
				<Switch checked={wordWrap} onChange={updateWordWrap} />
			</Setting>

			<Setting label="Interface theme">
				<Select data={THEMES} value={colorScheme} onChange={updateColorScheme} />
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
