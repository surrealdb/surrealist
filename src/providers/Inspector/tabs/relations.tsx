import { Group, Paper, ScrollArea, Text } from "@mantine/core";
import { Icon, iconCircle } from "@surrealdb/ui";
import { RecordId } from "surrealdb";
import { RecordLink } from "~/components/RecordLink";

export function normalizeRelations(relations: unknown): RecordId[] {
	if (!relations) {
		return [];
	}

	if (Array.isArray(relations)) {
		return relations.filter((relation): relation is RecordId => relation instanceof RecordId);
	}

	return relations instanceof RecordId ? [relations] : [];
}

interface RelationsListProps {
	name: string;
	relations: RecordId[];
}

function RelationsList({ name, relations }: RelationsListProps) {
	const items = normalizeRelations(relations);

	return (
		<Paper
			p="xs"
			bg="var(--mantine-color-body)"
			mt={6}
		>
			{items.length === 0 && (
				<Text
					pl={6}
					c="dimmed"
				>
					No {name} relations found
				</Text>
			)}

			{items.map((relation) => (
				<Group
					key={relation.toString()}
					gap="xs"
					wrap="nowrap"
				>
					<Icon
						path={iconCircle}
						size="lg"
					/>
					<RecordLink value={relation} />
				</Group>
			))}
		</Paper>
	);
}

export interface RelationsTabProps {
	isLight: boolean;
	inputs: RecordId[];
	outputs: RecordId[];
}

export function RelationsTab({ inputs, outputs }: RelationsTabProps) {
	return (
		<ScrollArea flex="1 0 0">
			<Text
				c="bright"
				size="lg"
				fw={600}
				mt={4}
			>
				Incoming relations
			</Text>

			<RelationsList
				name="incoming"
				relations={inputs}
			/>

			<Text
				c="bright"
				size="lg"
				fw={600}
				mt="xl"
			>
				Outgoing relations
			</Text>

			<RelationsList
				name="outgoing"
				relations={outputs}
			/>
		</ScrollArea>
	);
}
