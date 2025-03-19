import { TagsInput } from "@mantine/core";
import { Updater } from "use-immer";
import { useConnectionLabels } from "~/hooks/connection";
import { Connection } from "~/types";

export interface ConnectionLabelsDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionLabelsDetails({ value, onChange }: ConnectionLabelsDetailsProps) {
	const labels = useConnectionLabels();

	return (
		<TagsInput
			data={labels}
			value={value.labels ?? []}
			onChange={(value) =>
				onChange((draft) => {
					draft.labels = value;
				})
			}
			placeholder="Add labels (optional)"
		/>
	);
}
