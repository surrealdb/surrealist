import { Text } from "@mantine/core";
import { ScrollArea, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { OpenFn } from "~/types";
import { iconCircle } from "~/util/icons";

interface RelationsListProps {
	name: string;
	relations: any[];
	onOpen: OpenFn;
}

function RelationsList({ name, relations, onOpen }: RelationsListProps) {
	if (relations.length === 0) {
		return <Text>No {name} relations found</Text>;
	}

	return (
		<>
			{relations.map((relation) => (
				<Group key={relation} gap="xs" wrap="nowrap">
					<Icon path={iconCircle} size="lg" />
					<RecordLink value={relation} />
				</Group>
			))}
		</>
	);
}


export interface RelationsTabProps {
	isLight: boolean;
	inputs: any[];
	outputs: any[];
	onOpen: OpenFn;
}

export function RelationsTab({ isLight, inputs, outputs, onOpen }: RelationsTabProps) {
	return (
		<ScrollArea
			style={{
				position: "absolute",
				insetInline: 12,
				bottom: 0,
				top: 158,
			}}>

			<Text c={isLight ? "blue.9" : "light.0"} size="lg" mt={4}>
				Incoming relations
			</Text>

			<RelationsList name="incoming" relations={inputs} onOpen={onOpen} />

			<Text c={isLight ? "blue.9" : "light.0"} size="lg" mt="xl">
				Outgoing relations
			</Text>

			<RelationsList name="outgoing" relations={outputs} onOpen={onOpen} />
		</ScrollArea>
	);
}