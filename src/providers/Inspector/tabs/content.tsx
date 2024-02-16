import { Paper } from "@mantine/core";
import classes from "../style.module.scss";
import { SaveBox } from "~/components/SaveBox";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { SaveableHandle } from "~/hooks/save";

export interface ContentTabProps {
	value: string;
	saveHandle: SaveableHandle<any>;
	onChange: (value: string) => void;
}

export function ContentTab({ value, onChange, saveHandle }: ContentTabProps) {
	return (
		<>
			<Paper
				mt="xs"
				p="xs"
				withBorder
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: saveHandle.isChanged ? 62 : 14,
					top: 156,
				}}
			>
				<SurrealistEditor
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
				/>
			</Paper>

			{saveHandle.isChanged && (
				<SaveBox
					handle={saveHandle}
					inline
					inlineProps={{
						className: classes.saveBox,
						style: {
							position: "absolute",
							insetInline: 12,
							bottom: 12
						}
					}}
				/>
			)}
		</>
	);
}