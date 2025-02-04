import {
	type BoxProps,
	Button,
	Checkbox,
	Combobox,
	Group,
	Input,
	Menu,
	MultiSelect,
	NumberInput,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { Switch } from "@mantine/core";
import { isNumber } from "radash";
import { useConfigStore } from "~/stores/config";
import { iconChevronDown } from "~/util/icons";
import {
	CheckboxController,
	FlagSetController,
	NumberController,
	type PreferenceController,
	SelectionController,
	TextController,
} from "~/util/preferences";
import { Icon } from "../Icon";

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

	if (controller instanceof FlagSetController) {
		return (
			<Paper
				p="md"
				{...other}
			>
				<SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
					{controller.options.options.map((flag, i) => (
						<Switch
							key={i}
							styles={{
								labelWrapper: {
									flex: 1,
								},
								body: {
									width: "100%",
								},
							}}
							label={
								<Group
									fz="lg"
									miw={controller.options.minWidth}
								>
									{flag.icon && (
										<Icon
											path={flag.icon}
											size="sm"
										/>
									)}
									<Text fw={500}>{flag.label}</Text>
								</Group>
							}
							variant="gradient"
							checked={value[flag.value] ?? controller.options.default ?? false}
							onChange={(event) => {
								applyPreference(controller.options.writer, {
									...value,
									[flag.value]: event.target.checked,
								});
							}}
						/>
					))}
				</SimpleGrid>
			</Paper>
		);
	}
}
