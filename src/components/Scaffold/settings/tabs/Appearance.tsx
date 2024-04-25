import { Select, Slider, Box, Checkbox } from "@mantine/core";
import { useCheckbox } from "~/hooks/events";
import { isDesktop } from "~/adapter";
import { Label, SettingsSection } from "../utilities";
import { DESIGNER_DIRECTIONS, DESIGNER_NODE_MODES, VALUE_MODES, RESULT_MODES, THEMES, ORIENTATIONS } from "~/constants";
import { useSetting } from "~/hooks/config";
import { useFeatureFlags } from "~/util/feature-flags";

const CAT = "appearance";

export function AppearanceTab() {
	const [colorScheme, setColorScheme] = useSetting(CAT, "colorScheme");
	const [editorScale, setEditorScale] = useSetting(CAT, "editorScale");
	const [windowScale, setWindowScale] = useSetting(CAT, "windowScale");
	const [resultWordWrap, setResultWordWrap] = useSetting(CAT, "resultWordWrap");
	const [defaultResultMode, setDefaultResultMode] = useSetting(CAT, "defaultResultMode");
	const [queryOrientation, setQueryOrientation] = useSetting(CAT, "queryOrientation");
	const [valueMode, setValueMode] = useSetting(CAT, "valueMode");
	const [defaultDiagramMode, setDefaultDiagramMode] = useSetting(CAT, "defaultDiagramMode");
	const [defaultDiagramDirection, setDefaultDiagramDirection] = useSetting(CAT, "defaultDiagramDirection");
	const [expandSidebar, setExpandSidebar] = useSetting(CAT, "expandSidebar");

	const updateResultWordWrap = useCheckbox(setResultWordWrap);
	const updateExpandSidebar = useCheckbox(setExpandSidebar);

	const [flags] = useFeatureFlags();

	return (
		<>
			<SettingsSection>
				<Checkbox
					label="Expand sidebar on hover"
					checked={expandSidebar}
					onChange={updateExpandSidebar}
				/>
				{flags.themes && (
					<Select
						label="Theme"
						data={THEMES}
						value={colorScheme}
						onChange={setColorScheme as any}
					/>
				)}
				<Select
					label="Value formatting mode"
					data={VALUE_MODES}
					value={valueMode}
					onChange={setValueMode as any}
				/>
			</SettingsSection>

			<SettingsSection label="Scale">
				<Box>
					<Label>
						Editor font scale
					</Label>
					<Slider
						mt="xs"
						mb="lg"
						mx="xs"
						min={50}
						max={150}
						defaultValue={editorScale}
						onChangeEnd={setEditorScale}
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
					<Box>
						<Label>
							Window scale
						</Label>
						<Slider
							mt="xs"
							mb="lg"
							mx="sm"
							min={50}
							max={150}
							defaultValue={windowScale}
							onChangeEnd={setWindowScale}
							marks={[
								{ value: 50, label: '50%' },
								{ value: 75, label: '75%' },
								{ value: 100, label: '100%' },
								{ value: 125, label: '125%' },
								{ value: 150, label: '150%' },
							]}
						/>
					</Box>
				)}
			</SettingsSection>

			<SettingsSection label="Query view">
				<Checkbox
					label="Query results text wrapping"
					checked={resultWordWrap}
					onChange={updateResultWordWrap}
				/>

				<Select
					label="Default result view"
					data={RESULT_MODES}
					value={defaultResultMode}
					onChange={setDefaultResultMode as any}
				/>

				<Select
					label="Layout orientation"
					data={ORIENTATIONS}
					value={queryOrientation}
					onChange={setQueryOrientation as any}
				/>
			</SettingsSection>

			<SettingsSection label="Designer view">
				<Select
					label="Default node mode"
					data={DESIGNER_NODE_MODES}
					value={defaultDiagramMode}
					onChange={setDefaultDiagramMode as any}
				/>

				<Select
					label="Default layout direction"
					data={DESIGNER_DIRECTIONS}
					value={defaultDiagramDirection}
					onChange={setDefaultDiagramDirection as any}
				/>
			</SettingsSection>
		</>
	);
}
