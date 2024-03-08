import { Paper } from "@mantine/core";
import classes from "../style.module.scss";
import { SaveBox } from "~/components/SaveBox";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveableHandle } from "~/hooks/save";
import { json } from "@codemirror/lang-json";
import { scrollPastEnd } from "@codemirror/view";

export interface ContentTabProps {
	value: string;
	saveHandle: SaveableHandle<any>;
	onChange: (value: string) => void;
}

export function ContentTab({ value, onChange, saveHandle }: ContentTabProps) {
	return (
		<>
			<Paper
				flex={1}
				mih={0}
				mt="xs"
				p="xs"
				withBorder
			>
				<CodeEditor
					h="100%"
					language="json"
					value={value}
					onChange={onChange}
					options={{
						scrollBeyondLastLine: true,
						wrappingStrategy: "advanced",
						wordWrap: "off",
						suggest: {
							showProperties: false,
						}
					}}
					extensions={[
						json(),
						scrollPastEnd()
					]}
				/>
			</Paper>

			{saveHandle.isChanged && (
				<SaveBox
					handle={saveHandle}
					inline
					inlineProps={{
						className: classes.saveBox
					}}
				/>
			)}
		</>
	);
}