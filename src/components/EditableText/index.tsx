import { Text, type TextProps } from "@mantine/core";
import clsx from "clsx";
import { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { useLater } from "~/hooks/later";
import { useStable } from "~/hooks/stable";
import classes from "./style.module.scss";

export interface EditableTextProps
	extends TextProps,
		Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "style" | "color"> {
	value: string;
	disabled?: boolean;
	withDoubleClick?: boolean;
	withDecoration?: boolean;
	onChange: (value: string) => void;
}

export const EditableText = ({
	value,
	disabled,
	withDoubleClick,
	withDecoration,
	onChange,
	...other
}: EditableTextProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isEditing, setIsEditing] = useState(false);

	const doFocus = useLater(() => {
		if (!ref.current) return;

		ref.current.focus();

		const text = ref.current.childNodes[0] as Text;
		const range = document.createRange();

		range.selectNode(text);
		window.getSelection()?.removeAllRanges();
		window.getSelection()?.addRange(range);
	});

	const onKeyDown = useStable((e: React.KeyboardEvent<HTMLDivElement>) => {
		e.stopPropagation();

		if (e.key === "Enter") {
			e.preventDefault();
			ref.current?.blur();
		}

		onKeyDown?.(e);
	});

	const onBlur = useStable((e: React.FocusEvent<HTMLDivElement>) => {
		const textValue = ref.current?.textContent?.replaceAll("\n", "");

		onChange(textValue || "");
		setIsEditing(false);

		onBlur?.(e);
	});

	const onDoubleClick = useStable((e: React.MouseEvent<HTMLDivElement>) => {
		if (disabled) return;

		if (withDoubleClick) {
			setIsEditing(true);
			doFocus();
		}

		onDoubleClick?.(e);
	});

	useEffect(() => {
		if (ref.current) {
			ref.current.textContent = value;
		}
	}, [value]);

	return (
		<Text
			ref={ref}
			onBlur={onBlur}
			onKeyDown={onKeyDown}
			onDoubleClick={onDoubleClick}
			contentEditable={!disabled && (!withDoubleClick || isEditing)}
			className={clsx(classes.root, withDecoration && classes.decorate)}
			spellCheck={false}
			role={disabled ? undefined : "textbox"}
			{...other}
		/>
	);
};
