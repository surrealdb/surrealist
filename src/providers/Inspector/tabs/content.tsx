import { Alert, Paper } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { Icon, iconWarning } from "@surrealdb/ui";
import { useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveBox } from "~/components/SaveBox";
import { surqlLinting, surqlRecordLinks } from "~/editor";
import { useSetting } from "~/hooks/config";
import type { SaveableHandle } from "~/hooks/save";
import { useInspector } from "..";

export interface ContentTabProps {
	value: string;
	error: string;
	saveHandle: SaveableHandle;
	onChange: (value: string) => void;
}

export function ContentTab({ value, error, onChange, saveHandle }: ContentTabProps) {
	const { inspect } = useInspector();
	const [hasLineNumbers] = useSetting("appearance", "inspectorLineNumbers");

	const extensions = useMemo(
		() => [surrealql(), surqlLinting(), surqlRecordLinks(inspect)],
		[inspect],
	);

	return (
		<>
			{error && (
				<Alert
					icon={<Icon path={iconWarning} />}
					color="red.5"
					style={{
						whiteSpace: "pre-wrap",
					}}
				>
					{error}
				</Alert>
			)}

			<Paper
				flex="1 0 0"
				mih={0}
				p="xs"
			>
				<CodeEditor
					h="100%"
					value={value}
					onChange={onChange}
					lineNumbers={hasLineNumbers}
					extensions={extensions}
				/>
			</Paper>

			<SaveBox
				handle={saveHandle}
				inline
				withApply
			/>
		</>
	);
}
