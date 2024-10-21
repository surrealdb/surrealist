import { type BoxProps, Checkbox, NumberInput, Select, TextInput } from "@mantine/core";
import { isNumber } from "radash";
import { useConfigStore } from "~/stores/config";
import {
	CheckboxController,
	NumberController,
	type PreferenceController,
	SelectionController,
	TextController,
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

	if (controller instanceof TextController) {
		return (
			<TextInput
				{...other}
				value={value}
				size={compact ? "xs" : undefined}
				placeholder={controller.options.placeholder}
				w={250}
				onChange={(e) => {
					applyPreference(controller.options.writer, e.currentTarget.value);
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
