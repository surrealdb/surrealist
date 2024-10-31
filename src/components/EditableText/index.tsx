import { useInputState, useUncontrolled } from "@mantine/hooks";
import classes from "./style.module.scss";

import { type ElementProps, Text, TextInput, type TextProps } from "@mantine/core";
import clsx from "clsx";
import { type MouseEvent, useLayoutEffect } from "react";
import { useStable } from "~/hooks/stable";
import { ON_FOCUS_SELECT } from "~/util/helpers";

export interface EditableTextProps extends TextProps, ElementProps<"div", "onChange" | "color"> {
	value: string;
	editable?: boolean;
	activationMode?: "none" | "click" | "double-click";
	withDecoration?: boolean;
	onChange: (value: string) => void;
	onEditableChange?: (editable: boolean) => void;
}

export const EditableText = ({
	value,
	editable,
	activationMode,
	withDecoration,
	onChange,
	onEditableChange,
	onClick,
	onDoubleClick,
	...other
}: EditableTextProps) => {
	const [buffer, setBuffer] = useInputState(value);
	const [editing, setEditing] = useUncontrolled({
		defaultValue: false,
		value: editable,
		onChange: onEditableChange,
	});

	const handleActivation = useStable((e: MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		setEditing(true);

		if (activationMode === "click") {
			onClick?.(e);
		} else {
			onDoubleClick?.(e);
		}
	});

	const handleKeyDown = useStable((e: React.KeyboardEvent<HTMLInputElement>) => {
		e.stopPropagation();

		if (e.key === "Enter") {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		}
	});

	const handleBlur = useStable(() => {
		if (buffer !== value) {
			onChange(buffer);
		}

		setEditing(false);
	});

	useLayoutEffect(() => {
		if (editing) {
			setBuffer(value);
		}
	}, [editing, value]);

	return (
		<Text
			w="100%"
			ta="start"
			role={editing ? undefined : "button"}
			component="div"
			onClick={activationMode === "click" ? handleActivation : undefined}
			onDoubleClick={activationMode === "double-click" ? handleActivation : undefined}
			{...other}
		>
			{editing ? (
				<TextInput
					autoFocus
					w="100%"
					variant="unstyled"
					value={buffer}
					onChange={setBuffer}
					onKeyDownCapture={handleKeyDown}
					onBlur={handleBlur}
					onFocus={ON_FOCUS_SELECT}
					classNames={{
						input: clsx(classes.input, withDecoration && classes.decoration),
					}}
				/>
			) : (
				value
			)}
		</Text>
	);
};
