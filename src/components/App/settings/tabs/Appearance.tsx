import {
	DESIGNER_DIRECTIONS,
	DESIGNER_NODE_MODES,
	LINE_STYLES,
	ORIENTATIONS,
	RESULT_FORMATS,
	RESULT_MODES,
	SIDEBAR_MODES,
	THEMES,
} from "~/constants";

import { Box, Checkbox, Select, Slider } from "@mantine/core";
import { isDesktop } from "~/adapter";
import { Label } from "~/components/Label";
import { useSetting } from "~/hooks/config";
import { useCheckbox } from "~/hooks/events";
import { useFeatureFlags } from "~/util/feature-flags";
import { SettingsSection } from "../utilities";

const CAT = "appearance";

export function AppearanceTab() {
	const [colorScheme, setColorScheme] = useSetting(CAT, "colorScheme");
	const [editorScale, setEditorScale] = useSetting(CAT, "editorScale");
	const [windowScale, setWindowScale] = useSetting(CAT, "windowScale");
	const [sidebarMode, setSidebarMode] = useSetting(CAT, "sidebarMode");
	const [lineStyle, setLineStyle] = useSetting(CAT, "lineStyle");

	const [defaultResultMode, setDefaultResultMode] = useSetting(
		CAT,
		"defaultResultMode",
	);

	const [defaultResultFormat, setDefaultResultFormat] = useSetting(
		CAT,
		"defaultResultFormat",
	);

	const [queryOrientation, setQueryOrientation] = useSetting(
		CAT,
		"queryOrientation",
	);

	const [defaultDiagramMode, setDefaultDiagramMode] = useSetting(
		CAT,
		"defaultDiagramMode",
	);

	const [defaultDiagramDirection, setDefaultDiagramDirection] = useSetting(
		CAT,
		"defaultDiagramDirection",
	);

	const [defaultDiagramShowLinks, setDefaultDiagramShowLinks] = useSetting(
		CAT,
		"defaultDiagramShowLinks",
	);

	// const updateResultWordWrap = useCheckbox(setResultWordWrap);
	const updateDefaultDiagramShowLinks = useCheckbox(
		setDefaultDiagramShowLinks,
	);

	const [flags] = useFeatureFlags();

	return (
		<>
			<SettingsSection>
				{flags.themes && (
					<Select
						label="Color scheme"
						data={THEMES}
						value={colorScheme}
						onChange={setColorScheme as any}
					/>
				)}
				<Select
					data={SIDEBAR_MODES}
					label="Sidebar appearance"
					value={sidebarMode}
					onChange={setSidebarMode as any}
				/>
			</SettingsSection>

			<SettingsSection label="Scale">
				<Box>
					<Label>Editor font scale</Label>
					<Slider
						mt="xs"
						mb="lg"
						mx="xs"
						min={50}
						max={150}
						defaultValue={editorScale}
						onChangeEnd={setEditorScale}
						marks={[
							{ value: 50, label: "50%" },
							{ value: 75, label: "75%" },
							{ value: 100, label: "100%" },
							{ value: 125, label: "125%" },
							{ value: 150, label: "150%" },
						]}
					/>
				</Box>
				{isDesktop && (
					<Box>
						<Label>Window scale</Label>
						<Slider
							mt="xs"
							mb="lg"
							mx="sm"
							min={75}
							max={150}
							defaultValue={windowScale}
							onChangeEnd={setWindowScale}
							marks={[
								{ value: 75, label: "75%" },
								{ value: 100, label: "100%" },
								{ value: 125, label: "125%" },
								{ value: 150, label: "150%" },
							]}
						/>
					</Box>
				)}
			</SettingsSection>

			<SettingsSection label="Query view">
				{/* <Checkbox
					label="Query results text wrapping"
					checked={resultWordWrap}
					onChange={updateResultWordWrap}
				/> */}

				<Select
					label="Default result view"
					data={RESULT_MODES}
					value={defaultResultMode}
					onChange={setDefaultResultMode as any}
				/>

				<Select
					label="Default result format"
					data={RESULT_FORMATS}
					value={defaultResultFormat}
					onChange={setDefaultResultFormat as any}
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
					label="Diagram line style"
					data={LINE_STYLES}
					value={lineStyle}
					onChange={setLineStyle as any}
				/>

				<Select
					label="Node mode for new connections"
					data={DESIGNER_NODE_MODES}
					value={defaultDiagramMode}
					onChange={setDefaultDiagramMode as any}
				/>

				<Select
					label="Layout direction for new connections"
					data={DESIGNER_DIRECTIONS}
					value={defaultDiagramDirection}
					onChange={setDefaultDiagramDirection as any}
				/>

				<Checkbox
					label="Enable show links for new connections"
					checked={defaultDiagramShowLinks}
					onChange={updateDefaultDiagramShowLinks}
				/>
			</SettingsSection>
		</>
	);
}
