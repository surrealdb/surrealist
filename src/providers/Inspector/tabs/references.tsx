import { ScrollArea, Stack } from "@mantine/core";
import { iconArrowEnter } from "@surrealdb/ui";
import type { RecordId } from "surrealdb";
import { RecordCollection } from "../components";

export interface ReferencesTabProps {
	references: RecordId[];
}

export function ReferencesTab({ references }: ReferencesTabProps) {
	return (
		<ScrollArea flex="1 0 0">
			<Stack
				p="md"
				gap="md"
			>
				<RecordCollection
					title="Incoming references"
					description="Records that link to this record through a reference field."
					icon={iconArrowEnter}
					records={references}
					emptyText="No records reference this one"
				/>
			</Stack>
		</ScrollArea>
	);
}
