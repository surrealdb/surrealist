import { ActionIcon, TextInput, TextInputProps } from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import { Icon, iconSearch, useStable } from "@surrealdb/ui";
import { ChangeEvent, useRef } from "react";
import classes from "./style.module.scss";

export interface SearchInputProps extends Omit<TextInputProps, "value" | "onChange"> {
	value?: string;
	onChange?: (value: string) => void;
}

export function SearchInput({ value, onChange, ...rest }: SearchInputProps) {
	const ref = useRef<HTMLInputElement>(null);

	const [internalValue, internalOnChange] = useUncontrolled({
		value,
		defaultValue: "",
		onChange,
		finalValue: "",
	});

	const handleChange = useStable((event: ChangeEvent<HTMLInputElement>) => {
		internalOnChange(event.target.value);
	});

	const toggleFocus = useStable(() => {
		setTimeout(() => {
			ref.current?.focus();
		});
	});

	return (
		<TextInput
			{...rest}
			value={internalValue}
			onChange={handleChange}
			leftSection={
				<ActionIcon
					variant="transparent"
					tabIndex={-1}
					onMouseDown={toggleFocus}
				>
					<Icon path={iconSearch} />
				</ActionIcon>
			}
			radius="xl"
			className={classes.searchInput}
			mod={{ searching: !!internalValue }}
			ref={ref}
		/>
	);
}
