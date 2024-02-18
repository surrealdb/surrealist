import { Stack, Switch, Select, MantineColorScheme, Slider, Box } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { DesignerNodeMode } from "~/types";
import { Setting } from "../setting";
import { DESIGNER_NODE_MODES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { useCheckbox } from "~/hooks/events";
import { isDesktop } from "~/adapter";

const THEMES = [
	{ label: "Automatic", value: "auto" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export function AppearanceTab() {
	const {
		setColorScheme,
		setWordWrap,
		setDesignerNodeMode,
		setWindowScale,
		setEditorScale
	} = useConfigStore.getState();

	const colorScheme = useConfigStore((s) => s.colorScheme);
	const wordWrap = useConfigStore((s) => s.wordWrap);
	const defaultDesignerNodeMode = useConfigStore((s) => s.defaultDesignerNodeMode);
	const editorScale = useConfigStore((s) => s.editorScale);
	const windowScale = useConfigStore((s) => s.windowScale);

	const updateWordWrap = useCheckbox(setWordWrap);

	const updateColorScheme = useStable((value: string | null) => {
		setColorScheme(value as MantineColorScheme || 'light');
	});

	const updateNodeMode = useStable((mode: string | null) => {
		setDesignerNodeMode(mode as DesignerNodeMode || 'fields');
	});

	const updateWindowScale = useStable((scale: number) => {
		setWindowScale(scale as number);
	});

	const updateEditorScale = useStable((scale: number) => {
		setEditorScale(scale as number);
	});

	return (
		<Stack gap="xs" style={{ overflow: 'hidden' }}>
			<Setting label="Wrap query results">
				<Switch checked={wordWrap} onChange={updateWordWrap} />
			</Setting>

			<Setting label="Interface theme">
				<Select data={THEMES} value={colorScheme} onChange={updateColorScheme} />
			</Setting>

			<Setting label="Default designer appearance">
				<Select data={DESIGNER_NODE_MODES} value={defaultDesignerNodeMode} onChange={updateNodeMode} />
			</Setting>

			<Setting label="Editor font scale" />
			<Box pb="lg" px="sm">
				<Slider
					min={50}
					max={150}
					defaultValue={editorScale}
					onChangeEnd={updateEditorScale}
					marks={[
						{ value: 50, label: '50%' },
						{ value: 75, label: '75%' },
						{ value: 100, label: '100%' },
						{ value: 125, label: '125%' },
						{ value: 150, label: '150%' },
					]}
				/>
			</Box>

			{isDesktop && (
				<>
					<Setting label="Window scale" />
					<Box pb="lg" px="sm">
						<Slider
							min={50}
							max={150}
							defaultValue={windowScale}
							onChangeEnd={updateWindowScale}
							marks={[
								{ value: 50, label: '50%' },
								{ value: 75, label: '75%' },
								{ value: 100, label: '100%' },
								{ value: 125, label: '125%' },
								{ value: 150, label: '150%' },
							]}
						/>
					</Box>
				</>
			)}
		</Stack>
	);
}
