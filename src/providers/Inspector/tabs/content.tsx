import { Paper } from "@mantine/core";
import classes from "../style.module.scss";
import { SaveBox } from "~/components/SaveBox";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveableHandle } from "~/hooks/save";
import { surrealql } from "codemirror-surrealql";
import { surqlLinting, surqlRecordLinks } from "~/util/editor/extensions";
import { useInspector } from "..";
import { lineNumbers } from "@codemirror/view";

export interface ContentTabProps {
	value: string;
	saveHandle: SaveableHandle
	onChange: (value: string) => void;
}

export function ContentTab({ value, onChange, saveHandle }: ContentTabProps) {
	const { inspect } = useInspector();

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
						surrealql(),
						surqlLinting(),
						surqlRecordLinks(inspect),
						lineNumbers(),
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
