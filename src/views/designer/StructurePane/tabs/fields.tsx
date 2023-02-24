import { SchemaTabProps } from "./helpers";

export function FieldsTab(props: SchemaTabProps) {
	return (
		<div>
			{JSON.stringify(props.table?.fields)}
		</div>
	)
}