import classes from "./style.module.scss";

// TODO Split into multiple files

import { Compartment, EditorState, type Extension, Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder as ph } from "@codemirror/view";
import {
	ActionIcon,
	Autocomplete,
	type AutocompleteProps,
	Group,
	InputBase,
	type InputBaseProps,
	Pill,
	PillsInput,
	type PillsInputProps,
	Text,
	TextInput,
} from "@mantine/core";
import { clamp, useInputState } from "@mantine/hooks";
import { surrealql } from "@surrealdb/codemirror";
import clsx from "clsx";
import {
	type FocusEvent,
	type HTMLAttributes,
	type KeyboardEvent,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { Icon } from "~/components/Icon";
import { acceptWithTab, editorTheme, inputBase } from "~/editor";
import { useKindList } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight, useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { iconCancel, iconCheck } from "~/util/icons";
import { ActionButton } from "../ActionButton";

export interface CodeInputProps
	extends InputBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "style" | "value" | "onChange"> {
	value: string;
	height?: number;
	autoFocus?: boolean;
	placeholder?: string;
	readOnly?: boolean;
	extensions?: Extension;
	onChange: (value: string) => void;
	onMount?: (editor: EditorView) => void;
	onSubmit?: () => void;
}

export function CodeInput({
	value,
	height,
	autoFocus,
	readOnly,
	extensions,
	disabled,
	multiline,
	className,
	placeholder,
	onChange,
	onMount,
	onSubmit,
	...rest
}: CodeInputProps) {
	const ref = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<{
		editor: EditorView;
		readOnlyComp: Compartment;
		fallbackComp: Compartment;
		keymapsComp: Compartment;
		themeComp: Compartment;
	}>();

	const colorScheme = useTheme();
	const syntaxTheme = useConfigStore((s) => s.settings.appearance.syntaxTheme);

	// biome-ignore lint/correctness/useExhaustiveDependencies: One-time initialization
	useEffect(() => {
		if (!ref.current) return;

		const readOnlyComp = new Compartment();
		const fallbackComp = new Compartment();
		const keymapsComp = new Compartment();
		const themeComp = new Compartment();

		const changeHandler = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onChange?.(update.state.doc.toString());
			}
		});

		const initialState = EditorState.create({
			doc: value,
			extensions: [
				inputBase(),
				changeHandler,
				extensions || surrealql(),
				themeComp.of(editorTheme(colorScheme, syntaxTheme)),
				readOnlyComp.of(EditorState.readOnly.of(!!disabled || !!readOnly)),
				fallbackComp.of(placeholder ? ph(placeholder) : []),
				keymapsComp.of([]),
			],
		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current,
		});

		editorRef.current = {
			editor,
			readOnlyComp,
			fallbackComp,
			keymapsComp,
			themeComp,
		};

		if (autoFocus) {
			const timer = setInterval(() => {
				editor.focus();
				if (editor.hasFocus) clearInterval(timer);
			}, 50);
		}

		onMount?.(editor);

		return () => {
			editor.destroy();
		};
	}, []);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor } = editorRef.current;

		if (value === editor.state.doc.toString()) {
			return;
		}

		const transaction = editor.state.update({
			changes: {
				from: 0,
				to: editor.state.doc.length,
				insert: value,
			},
			effects: [EditorView.scrollIntoView(0)],
		});

		editor.dispatch(transaction);
	}, [value]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, readOnlyComp } = editorRef.current;
		const editableExt = EditorState.readOnly.of(!!disabled || !!readOnly);

		editor.dispatch({
			effects: readOnlyComp.reconfigure(editableExt),
		});
	}, [disabled, readOnly]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, fallbackComp } = editorRef.current;
		const fallbackExt = placeholder ? ph(placeholder) : [];

		editor.dispatch({
			effects: fallbackComp.reconfigure(fallbackExt),
		});
	}, [placeholder]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, keymapsComp } = editorRef.current;
		const value = Prec.highest(
			keymap.of(
				multiline
					? [acceptWithTab]
					: [
							{
								key: "Enter",
								run: () => {
									onSubmit?.();
									return true;
								},
							},
						],
			),
		);

		editor.dispatch({
			effects: keymapsComp.reconfigure(value),
		});
	}, [multiline, onSubmit]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, themeComp } = editorRef.current;

		editor.dispatch({
			effects: themeComp.reconfigure(editorTheme(colorScheme, syntaxTheme)),
		});
	}, [colorScheme, syntaxTheme]);

	return (
		<InputBase
			ref={ref}
			component="div"
			multiline
			className={clsx(classes.codeInput, className)}
			disabled={disabled}
			__vars={{
				"--height": height ? `${height}px` : undefined,
			}}
			{...rest}
		/>
	);
}

export function PermissionInput({
	value,
	onChange,
	...rest
}: Omit<CodeInputProps, "value" | "onChange"> & {
	value: string | boolean;
	onChange: (value: string | boolean) => void;
}) {
	const textValue = useMemo(() => {
		if (value === true) {
			return "FULL";
		}

		if (value === false) {
			return "NONE";
		}

		return value;
	}, [value]);

	const handleChange = useStable((value: string) => {
		if (value === "FULL" || value === "true") {
			onChange(true);
		} else if (value === "NONE" || value === "false") {
			onChange(false);
		} else {
			onChange(value);
		}
	});

	return (
		<CodeInput
			placeholder="user = $auth.id"
			multiline
			value={textValue}
			onChange={handleChange}
			rightSectionWidth={70}
			extensions={[surrealql("permission")]}
			rightSection={
				<Group gap="xs">
					<ActionButton
						color="green.4"
						label="Grant full access"
						onClick={() => onChange("FULL")}
						variant={textValue.toUpperCase() === "FULL" ? "light" : "subtle"}
					>
						<Icon path={iconCheck} />
					</ActionButton>
					<ActionButton
						color="pink.6"
						label="Reject all access"
						onClick={() => onChange("NONE")}
						variant={textValue.toUpperCase() === "NONE" ? "light" : "subtle"}
					>
						<Icon path={iconCancel} />
					</ActionButton>
				</Group>
			}
			{...rest}
		/>
	);
}

export interface FieldKindInputProps extends AutocompleteProps {
	value: string;
	onChange: (value: string) => void;
}

export function FieldKindInput({ className, ...rest }: FieldKindInputProps) {
	const kinds = useKindList();

	return (
		<FieldKindInputCore
			data={kinds}
			{...rest}
		/>
	);
}

export interface FieldKindInputCoreProps extends AutocompleteProps {
	data: string[];
	value: string;
	onChange: (value: string) => void;
}

export function FieldKindInputCore({ className, data, ...rest }: FieldKindInputProps) {
	return (
		<Autocomplete
			data={data}
			spellCheck={false}
			className={clsx(classes.input, classes.kindInput, className)}
			{...rest}
		/>
	);
}

export interface EmailInputProps extends Omit<PillsInputProps, "value" | "onChange"> {
	value: string[];
	onChange: (value: string[]) => void;
}

export function EmailInput({ value, onChange, autoFocus, ...other }: EmailInputProps) {
	const [draft, setDraft] = useInputState("");
	const isValid = !draft || draft.includes("@");
	const isLight = useIsLight();

	const handleSubmit = useStable(() => {
		if (!draft || !isValid) return;

		if (!value.includes(draft)) {
			onChange([...value, draft]);
		}

		setDraft("");
	});

	const handleKey = useStable((e: KeyboardEvent) => {
		if ((e.code === "Enter" || e.code === "Space") && draft) {
			handleSubmit();
			e.preventDefault();
		} else if (e.code === "Backspace" && !draft && value.length > 0) {
			onChange?.(value.slice(0, -1));
		}
	});

	return (
		<PillsInput
			{...other}
			error={!isValid}
		>
			<Pill.Group mih={22}>
				{value.map((email, i) => (
					<Pill
						key={email}
						withRemoveButton
						onRemove={() => onChange?.(value.filter((_, j) => i !== j))}
						bg={isLight ? "slate.1" : "slate.9"}
					>
						{email}
					</Pill>
				))}
				<PillsInput.Field
					placeholder="Enter email addresses..."
					autoFocus={autoFocus}
					value={draft}
					onChange={setDraft}
					onBlur={handleSubmit}
					onKeyDown={handleKey}
				/>
			</Pill.Group>
		</PillsInput>
	);
}

export interface CounterInputProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
}

export function CounterInput({ value, onChange, min, max }: CounterInputProps) {
	const isMin = min !== undefined && Number(value) <= min;
	const isMax = max !== undefined && Number(value) >= max;

	const [valueText, setValueText] = useInputState("");

	const updateUnits = useStable((value: number) => {
		const clamped = clamp(value, min ?? Number.MIN_VALUE, max ?? Number.MAX_VALUE);

		onChange(clamped);
		setValueText(clamped.toString());
	});

	const submitCount = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		e.preventDefault();
		updateUnits(Number.parseInt(valueText));
	});

	useEffect(() => {
		setValueText(value.toString());
	}, [value]);

	return (
		<Group>
			<ActionIcon
				disabled={isMin}
				onClick={() => updateUnits(value - 1)}
			>
				<Text
					c="bright"
					fw={500}
					fz="lg"
				>
					-
				</Text>
			</ActionIcon>
			<TextInput
				w={75}
				value={valueText}
				onChange={setValueText}
				onBlur={submitCount}
				onKeyDown={submitCount}
				type="number"
				size="xs"
				radius="sm"
				styles={{
					input: {
						textAlign: "center",
						fontWeight: 500,
						fontSize: "var(--mantine-font-size-lg)",
					},
				}}
			/>
			<ActionIcon
				disabled={isMax}
				onClick={() => updateUnits(value + 1)}
			>
				<Text
					c="bright"
					fw={500}
					fz="lg"
				>
					+
				</Text>
			</ActionIcon>
		</Group>
	);
}
