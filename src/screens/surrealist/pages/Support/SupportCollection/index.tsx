import { Box, Group, Image, Paper, Text } from "@mantine/core";
import { pictoSurrealDB } from "@surrealdb/ui";
import { Link } from "wouter";
import { IntercomSupportCollectionShallow } from "~/types";

export interface SupportCollectionProps {
	collection: IntercomSupportCollectionShallow;
}

export function SupportCollection({ collection }: SupportCollectionProps) {
	return (
		<Link
			href={`/support/collections/${collection.id}`}
			style={{
				color: "unset",
			}}
		>
			<Paper
				p="lg"
				radius="md"
				variant="interactive"
			>
				<Group wrap="nowrap">
					<Image
						mx="sm"
						src={collection.image ?? pictoSurrealDB}
						w={35}
						h={35}
					/>
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{collection.name}
						</Text>
						<Text mt="xs">{collection.description}</Text>
					</Box>
				</Group>
			</Paper>
		</Link>
	);
}
