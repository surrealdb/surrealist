import { Alert, Box, Divider, Stack } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { Icon, iconJSON, iconWarning } from "@surrealdb/ui";
import { useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveBox } from "~/components/SaveBox";
import { surqlLinting, surqlRecordLinks } from "~/editor";
import { useSetting } from "~/hooks/config";
import type { SaveableHandle } from "~/hooks/save";
import { useInspector } from "..";
import { InspectorSection } from "../components";
import classes from "../style.module.scss";

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
			<Stack
				gap={0}
				flex="1 0 0"
			>
				<Box
					px="md"
					pt="md"
				>
					<InspectorSection
						icon={iconJSON}
						title="Content"
						description="View and edit the content of this record"
					/>
				</Box>

				{error && (
					<Alert
						icon={<Icon path={iconWarning} />}
						color="red"
						mt="md"
						style={{
							whiteSpace: "pre-wrap",
						}}
					>
						{error}
					</Alert>
				)}

				<CodeEditor
					flex="1 0 0"
					value={value}
					onChange={onChange}
					lineNumbers={hasLineNumbers}
					extensions={extensions}
					className={classes.content}
				/>

				<Divider
					mx="-md"
					mt={0}
				/>
			</Stack>

			<SaveBox
				handle={saveHandle}
				inline
				withApply
			/>
		</>
	);
}
