import { Paper } from "@mantine/core";
import { surrealql } from "codemirror-surrealql";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveBox } from "~/components/SaveBox";
import { SaveableHandle } from "~/hooks/save";
import { surqlLinting } from "~/util/editor/extensions";
import classes from "../style.module.scss";

export interface ContentTabProps {
	value: string;
	saveHandle: SaveableHandle;
	onChange: (value: string) => void;
}

export function ContentTab({ value, onChange, saveHandle }: ContentTabProps) {
	return (
		<>
			<Paper flex="1 0 0" mih={0} mt="xs" p="xs">
				<CodeEditor
					h="100%"
					value={value}
					onChange={onChange}
					extensions={[surrealql(), surqlLinting()]}
				/>
			</Paper>

			{saveHandle.isChanged && (
				<SaveBox
					handle={saveHandle}
					inline
					inlineProps={{
						className: classes.saveBox,
					}}
				/>
			)}
		</>
	);
}
