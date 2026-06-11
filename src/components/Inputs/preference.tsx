import {
	type BoxProps,
	Checkbox,
	NumberInput,
	Select,
	SimpleGrid,
	Slider,
	TextInput,
} from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { isNumber } from "radash";
import { useConfigStore } from "~/stores/config";
import {
	CheckboxController,
	FlagSetController,
	NumberController,
	type PreferenceController,
	SelectionController,
	SliderController,
	TextController,
} from "~/util/preferences";
import { Option } from "../Option";

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
				min={controller.options.min}
				max={controller.options.max}
				onChange={(input) => {
					applyPreference(
						controller.options.writer,
						isNumber(input) ? input : Number.parseInt(input),
					);
				}}
			/>
		);
	}

	if (controller instanceof SliderController) {
		return (
			<Slider
				{...other}
				w={200}
				min={controller.options.min ?? 0}
				max={controller.options.max ?? 1}
				step={controller.options.step ?? 0.05}
				value={value}
				color="violet"
				label={controller.options.label}
				onChange={(input) => {
					applyPreference(controller.options.writer, input);
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

	if (controller instanceof FlagSetController) {
		return (
			<SimpleGrid
				cols={{ base: 1, sm: 2, xl: 3 }}
				{...other}
			>
				{controller.options.options.map((flag, i) => (
					<Option
						key={i}
						label={flag.label}
						icon={flag.icon && <Icon path={flag.icon} />}
						checked={value[flag.value] ?? controller.options.default ?? false}
						onChange={(val) => {
							applyPreference(controller.options.writer, {
								...value,
								[flag.value]: val,
							});
						}}
					/>
				))}
			</SimpleGrid>
		);
	}
}
