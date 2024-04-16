import { Paper } from "@mantine/core";
import classes from "../style.module.scss";
import { SaveBox } from "~/components/SaveBox";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveableHandle } from "~/hooks/save";
import { json } from "@codemirror/lang-json";

export interface ContentTabProps {
	value: string;
	saveHandle: SaveableHandle
	onChange: (value: string) => void;
}

export function ContentTab({ value, onChange, saveHandle }: ContentTabProps) {
	return (
		<>
			<Paper
				flex="1 0 0"
				mih={0}
				mt="xs"
				p="xs"
			>
				<CodeEditor
					h="100%"
					value={value}
					onChange={onChange}
					extensions={[
						json()
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