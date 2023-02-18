import { SchemaTabProps } from "./helpers";

export function GraphTab(props: SchemaTabProps) {
	return (
		<div>
			{JSON.stringify(props.tableInfo)}
		</div>
	)
}