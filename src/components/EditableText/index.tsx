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

	const handleEnter = useStable((e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			ref.current?.blur();
		}
	});

	const submit = useStable(() => {
		const textValue = ref.current?.textContent?.replaceAll('\n', '');

		onChange(textValue || '');
	});

	useEffect(() => {
		if (ref.current) {
			ref.current.textContent = value;
		}
	}, [value]);

	return (
		<Text
			ref={ref}
			onBlur={submit}
			onKeyDown={handleEnter}
			contentEditable={"plaintext-only" as any}
			role="textbox"
			{...rest}
		/>
	);
};