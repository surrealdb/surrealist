import { Paper, Text } from "@mantine/core";
import { ScrollArea, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { useIsLight } from "~/hooks/theme";
import { OpenFn } from "~/types";
import { iconCircle } from "~/util/icons";

interface RelationsListProps {
	name: string;
	relations: any[];
	onOpen: OpenFn;
}

function RelationsList({ name, relations, onOpen }: RelationsListProps) {
	const isLight = useIsLight();

	return (
		<Paper
			p="xs"
			bg={isLight ? "slate.0" : "slate.9"}
			radius="lg"
			mt={6}
		>
			{relations.length === 0 && (
				<Text pl={6} c="dimmed">
					No {name} relations found
				</Text>
			)}

			{relations.map((relation) => (
				<Group key={relation} gap="xs" wrap="nowrap">
					<Icon path={iconCircle} size="lg" />
					<RecordLink value={relation} />
				</Group>
			))}
		</Paper>
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

			<Text c="bright" size="lg" fw={600} mt={4}>
				Incoming relations
			</Text>

			<RelationsList name="incoming" relations={inputs} onOpen={onOpen} />

			<Text c="bright" size="lg" fw={600} mt="xl">
				Outgoing relations
			</Text>

			<RelationsList name="outgoing" relations={outputs} onOpen={onOpen} />
		</ScrollArea>
	);
}