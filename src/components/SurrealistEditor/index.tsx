import { Editor, EditorProps } from "@monaco-editor/react";
import { CSSProperties } from "react";
import { useIsLight } from "~/hooks/theme";
import { baseEditorConfig } from "~/util/editor";

export interface SurrealistEditorProps extends EditorProps {
	style?: CSSProperties;
}

export function SurrealistEditor(props: SurrealistEditorProps) {
	const isLight = useIsLight();

	const options = {
		...baseEditorConfig,
		...props.options,
	}

	return (
		<div
			style={{
				...props.style,
				fontFamily: 'JetBrains Mono'
			}}
		>
			<Editor
				{...props}
				theme={isLight ? 'surrealist' : 'surrealist-dark'}
				options={options}
			/>
		</div>
	)
}