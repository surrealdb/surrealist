import { type BoxProps, Checkbox, NumberInput, Select } from "@mantine/core";
import { isNumber } from "radash";
import { useConfigStore } from "~/stores/config";
import {
	CheckboxController,
	NumberController,
	SelectionController,
	type PreferenceController,
} from "~/util/preferences";

export interface PreferenceInputProps extends BoxProps {
	controller: PreferenceController;
	compact?: boolean;
}

export function PreferenceInput({ controller, compact, ...other }: PreferenceInputProps) {
	const { applyPreference } = useConfigStore.getState();
	const value = useConfigStore((state) => controller.options.reader(state));

	if (controller instanceof CheckboxController) {
		return (
			<Checkbox
				{...other}
				checked={value}
				onChange={(event) => {
					applyPreference(controller.options.writer, event.target.checked);
				}}
			/>
		);
	}

	if (controller instanceof NumberController) {
		return (
			<NumberInput
				{...other}
				value={value}
				size={compact ? "xs" : undefined}
				onChange={(input) => {
					applyPreference(
						controller.options.writer,
						isNumber(input) ? input : Number.parseInt(input),
					);
				}}
			/>
		);
	}

	if (controller instanceof SelectionController) {
		return (
			<Select
				{...other}
				data={controller.options.options}
				value={value}
				size={compact ? "xs" : undefined}
				onChange={(input) => {
					applyPreference(controller.options.writer, input);
				}}
			/>
		);
	}
}
