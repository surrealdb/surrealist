import classes from "./style.module.scss";
import { HTMLAttributes, useEffect, useRef, useState } from 'react';
import { useStable } from '~/hooks/stable';
import { Text, TextProps } from '@mantine/core';
import { useLater } from '~/hooks/later';
import clsx from "clsx";

export interface EditableTextProps extends TextProps, Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'style' | 'color'> {
	value: string;
	withDoubleClick?: boolean;
	withDecoration?: boolean;
	onChange: (value: string) => void;
}

export const EditableText = (props: EditableTextProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isEditing, setIsEditing] = useState(false);

	const {
		value,
		onChange,
		withDoubleClick,
		withDecoration,
		...rest
	} = props;

	const doFocus = useLater(() => {
		ref.current!.focus();

		const text = ref.current!.childNodes[0] as Text;
		const range = document.createRange();

		range.selectNode(text);
		window.getSelection()?.removeAllRanges();
		window.getSelection()?.addRange(range);
	});

	const onKeyDown = useStable((e: React.KeyboardEvent<HTMLDivElement>) => {
		e.stopPropagation();

		if (e.key === 'Enter') {
			e.preventDefault();
			ref.current?.blur();
		}

		rest?.onKeyDown?.(e);
	});

	const onBlur = useStable((e: React.FocusEvent<HTMLDivElement>) => {
		const textValue = ref.current?.textContent?.replaceAll('\n', '');

		onChange(textValue || '');
		setIsEditing(false);

		rest?.onBlur?.(e);
	});

	const onDoubleClick = useStable((e: React.MouseEvent<HTMLDivElement>) => {
		if (withDoubleClick) {
			setIsEditing(true);
			doFocus();
		}

		rest?.onDoubleClick?.(e);
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
			contentEditable={!withDoubleClick || isEditing ? "plaintext-only" as any : "false"}
			className={clsx(classes.root, withDecoration && classes.decorate)}
			role="textbox"
			{...rest}
		/>
	);
};