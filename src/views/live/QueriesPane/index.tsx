import { ActionIcon, Group, Paper } from "@mantine/core";
import { mdiBullhornVariant, mdiCircleMedium, mdiPencil, mdiPlay, mdiPlus } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { Spacer } from "~/components/Spacer";
import { useActiveSession } from "~/hooks/environment";

export interface QueriesPaneProps {
	onAddQuery: () => void;
	onEditQuery: (id: string) => void;
}

export function QueriesPane(props: QueriesPaneProps) {
	const session = useActiveSession();

	return (
		<Panel
			title="Sessions"
			icon={mdiBullhornVariant}
			rightSection={
				<ActionIcon
					title="Add live query"
					onClick={props.onAddQuery}
				>
					<Icon color="light.4" path={mdiPlus} />
				</ActionIcon>
			}
		>
			{session.liveQueries.map((query, i) => (
				<Paper
					key={i}
					bg="dark.9"
					p="sm"
					c="white"
				>
					<Group spacing="sm">
						<Icon
							path={mdiCircleMedium}
							color="blue"
						/>
						{query.name}
						<Spacer />
						<ActionIcon
							title="Edit query"
							onClick={() => props.onEditQuery(query.id)}
						>
							<Icon path={mdiPencil} />
						</ActionIcon>
						<ActionIcon
							title="Start query"
							onClick={() => {}}
						>
							<Icon path={mdiPlay} />
						</ActionIcon>
					</Group>
				</Paper>	
			))}
		</Panel>
	);
}