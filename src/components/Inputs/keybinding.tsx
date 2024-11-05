import { TextInput, type TextInputProps } from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import { type KeyboardEvent, useRef } from "react";
import { useStable } from "~/hooks/stable";
import { displayBinding, isModifierKey, simplifyKey } from "~/providers/Commands/keybindings";

export interface KeybindInputProps extends Omit<TextInputProps, "value" | "onChange"> {
	value?: string[];
	onChange?: (value: string[]) => void;
}

export function KeybindInput({ value, onChange, ...rest }: KeybindInputProps) {
	const modifiersRef = useRef<Set<string>>(new Set());

	const [_value, _onChange] = useUncontrolled({
		value,
		defaultValue: [],
		finalValue: [],
		onChange,
	});

	const handleKeyDown = useStable((e: KeyboardEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const keyName = simplifyKey(e.code);
		const isMod = isModifierKey(keyName);

		if (isMod) {
			modifiersRef.current.add(keyName);
			return;
		}

		const keys = [...modifiersRef.current, keyName];

		_onChange(keys);
	});

	const handleKeyUp = useStable((e: KeyboardEvent) => {
		modifiersRef.current.delete(simplifyKey(e.code));
	});

	return (
		<TextInput
			readOnly
			value={displayBinding(_value)}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			styles={{
				input: {
					fontSize: "var(--mantine-font-size-lg)",
					fontFamily: "var(--mantine-font-family-monospace)",
				},
			}}
			{...rest}
		/>
	);
}
