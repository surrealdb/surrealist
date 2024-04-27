import { Paper, Text } from "@mantine/core";
import { ScrollArea, Group } from "@mantine/core";
import { RecordId } from "surrealdb.js";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { useIsLight } from "~/hooks/theme";
import { iconCircle } from "~/util/icons";

interface RelationsListProps {
	name: string;
	relations: RecordId[];
}

function RelationsList({ name, relations }: RelationsListProps) {
	const isLight = useIsLight();

	return (
		<Paper
			p="xs"
			bg={isLight ? "slate.0" : "slate.9"}
			mt={6}
		>
			{relations.length === 0 && (
				<Text pl={6} c="dimmed">
					No {name} relations found
				</Text>
			)}

			{relations.map((relation, i) => (
				<Group key={i} gap="xs" wrap="nowrap">
					<Icon path={iconCircle} size="lg" />
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
		<ScrollArea
			flex="1 0 0"
		>

			<Text c="bright" size="lg" fw={600} mt={4}>
				Incoming relations
			</Text>

			<RelationsList name="incoming" relations={inputs} />

			<Text c="bright" size="lg" fw={600} mt="xl">
				Outgoing relations
			</Text>

			<RelationsList name="outgoing" relations={outputs} />
		</ScrollArea>
	);
}