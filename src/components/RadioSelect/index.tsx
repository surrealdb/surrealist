import { type ComboboxItem, Radio, Stack } from "@mantine/core";

export interface RadioSelectProps {
	data: ReadonlyArray<ComboboxItem>;
	value?: string;
	label?: string;
	onChange?(value: string): void;
}

export function RadioSelect(props: RadioSelectProps) {
	return (
		<Radio.Group
			label={props.label}
			value={props.value}
			onChange={props.onChange}
		>
			<Stack mt="xs">
				{props.data.map((item) => (
					<Radio
						key={item.value}
						value={item.value}
						label={item.label}
					/>
				))}
			</Stack>
		</Radio.Group>
	);
}
