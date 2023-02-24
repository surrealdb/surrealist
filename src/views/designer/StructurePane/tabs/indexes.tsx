import { SchemaTabProps } from "./helpers";

export function IndexesTab(props: SchemaTabProps) {
	return (
		<div>
			{JSON.stringify(props.table?.indexes)}
		</div>
	)
}