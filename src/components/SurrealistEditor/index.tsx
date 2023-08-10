import { Editor, EditorProps } from "@monaco-editor/react";
import { CSSProperties } from "react";
import { useIsLight } from "~/hooks/theme";
import { DARK_THEME, LIGHT_THEME, baseEditorConfig } from "~/util/editor";

export interface SurrealistEditorProps extends EditorProps {
	style?: CSSProperties;
	noExpand?: boolean;
}

export function SurrealistEditor(props: SurrealistEditorProps) {
	const isLight = useIsLight();

	const options = {
		...baseEditorConfig,
		...props.options,
	};

	return (
		<div
			style={{
				...props.style,
				fontFamily: 'JetBrains Mono',
				height: props.noExpand ? undefined : '100%'
			}}
		>
			<Editor
				{...props}
				theme={isLight ? LIGHT_THEME : DARK_THEME}
				options={options}
			/>
		</div>
	);
}