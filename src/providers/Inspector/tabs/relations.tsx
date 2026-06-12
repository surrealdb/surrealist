import { ScrollArea, Stack } from "@mantine/core";
import { iconRelationIn, iconRelationOut } from "@surrealdb/ui";
import { RecordId } from "surrealdb";
import { RecordCollection } from "../components";

export function normalizeRelations(relations: unknown): RecordId[] {
	if (!relations) {
		return [];
	}

	if (Array.isArray(relations)) {
		return relations.filter((relation): relation is RecordId => relation instanceof RecordId);
	}

	return relations instanceof RecordId ? [relations] : [];
}

export interface RelationsTabProps {
	inputs: RecordId[];
	outputs: RecordId[];
}

export function RelationsTab({ inputs, outputs }: RelationsTabProps) {
	return (
		<ScrollArea flex="1 0 0">
			<Stack
				p="md"
				gap="xl"
			>
				<RecordCollection
					title="Incoming relations"
					description="Relations that point to this record"
					icon={iconRelationIn}
					records={inputs}
					emptyText="No incoming relations point to this record"
				/>

				<RecordCollection
					title="Outgoing relations"
					description="Relations that this record points to"
					icon={iconRelationOut}
					records={outputs}
					emptyText="This record has no outgoing relations"
				/>
			</Stack>
		</ScrollArea>
	);
}
