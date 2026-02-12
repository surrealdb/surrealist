import { Anchor, Box, Group, Image, Paper, Text } from "@mantine/core";
import { pictoSurrealDB } from "@surrealdb/ui";
import { IntercomSupportCollectionShallow } from "~/types";

export interface SupportCollectionProps {
	collection: IntercomSupportCollectionShallow;
}

export function SupportCollection({ collection }: SupportCollectionProps) {
	return (
		<Anchor
			href={`/support/collections/${collection.id}`}
			variant="glow"
		>
			<Paper
				p="lg"
				radius="md"
			>
				<Group
					wrap="nowrap"
					gap="lg"
				>
					<Image
						src={collection.image ?? pictoSurrealDB}
						w={35}
						h={35}
					/>
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="lg"
						>
							{collection.name}
						</Text>
						<Text
							c="dimmed"
							mt="xs"
							fz="xs"
						>
							{collection.description}
						</Text>
					</Box>
				</Group>
			</Paper>
		</Anchor>
	);
}
