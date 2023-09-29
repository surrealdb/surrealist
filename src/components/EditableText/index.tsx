import { ElementRef, HTMLAttributes, useEffect, useRef } from 'react';
import { useInputState, useToggle } from '@mantine/hooks';
import classes from './style.module.scss';
import { useStable } from '~/hooks/stable';

export interface EditableTextProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	activation?: 'focus' | 'doubleClick';
	inputProps?: HTMLAttributes<HTMLInputElement>;
	minWidth?: number;
}

export const EditableText = (props: EditableTextProps) => {
	const inputRef = useRef<ElementRef<'input'>>(null);
	const sizerRef = useRef<ElementRef<'span'>>(null);

	const [ editText, setEditText ] = useInputState(props.value);
	const [ isEditing, setIsEditing ] = useToggle();
	
	const {
		value,
		onChange,
		placeholder,
		inputProps,
		activation,
		minWidth,
		...rest
	} = props;

	const activateMode = activation || 'focus';

	const recomputeSize = useStable(() => {
		const input = inputRef.current!;
		const sizer = sizerRef.current!;
		const minSize = minWidth || 50;

		input.style.width = `${Math.max(minSize, sizer.offsetWidth + 5)}px`;
	});

	useEffect(() => {
		setEditText(value);
	}, [value]);

	useEffect(() => {
		const sizer = sizerRef.current!;
		const observer = new ResizeObserver(recomputeSize);

		observer.observe(sizer);
		
		return () => observer.disconnect();
	}, []);

	const activate = useStable(() => {
		setIsEditing(true);
		inputRef.current?.focus();
		inputRef.current?.select();
	});

	const handleFocus = useStable(() => {
		if (activateMode === 'focus') {
			activate();
		}
	});

	const handleClick = useStable(() => {
		if (activateMode === 'doubleClick') {
			activate();
		}
	});

	const handleBlur = () => {
		if (!isEditing) return;

		setIsEditing(false);
		onChange(editText);
	};

	const handleKey = useStable((e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key == 'Enter' && document.activeElement !== inputRef.current) {
			handleFocus();
		} else if (e.key === 'Enter' || e.key === 'Escape') {
			inputRef.current?.blur();
		}

		e.stopPropagation();
	});

	return (
		<div
			className={classes.root}
			onClick={handleFocus}
			onDoubleClick={handleClick}
			{...rest}
		>
			<input
				ref={inputRef}
				className={classes.input}
				value={editText}
				onChange={setEditText}
				placeholder={placeholder}
				readOnly={!isEditing}
				style={{ pointerEvents: isEditing ? 'all' : 'none' }}
				onBlur={handleBlur}
				onKeyDown={handleKey}
				{...inputProps}
			/>
			<span
				ref={sizerRef}
				className={classes.sizer}
			>
				{editText || placeholder}
			</span>
		</div>
	);
};