import { HTMLAttributes, useEffect, useRef } from 'react';
import { useStable } from '~/hooks/stable';
import { Text, TextProps } from '@mantine/core';

export interface EditableTextProps extends TextProps, Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'style' | 'color'> {
	value: string;
	onChange: (value: string) => void;
}

export const EditableText = (props: EditableTextProps) => {
	const ref = useRef<HTMLInputElement>(null);

	const {
		value,
		onChange,
		...rest
	} = props;

	const onKeyDown = useStable((e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			ref.current?.blur();
		}

		rest?.onKeyDown?.(e);
	});

	const onBlur = useStable((e: React.FocusEvent<HTMLDivElement>) => {
		const textValue = ref.current?.textContent?.replaceAll('\n', '');

		onChange(textValue || '');

		rest?.onBlur?.(e);
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
			contentEditable={"plaintext-only" as any}
			role="textbox"
			{...rest}
		/>
	);
};