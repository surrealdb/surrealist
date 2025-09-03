import { Box, Group, Image, Paper, Text } from "@mantine/core";

export interface ResourceTileProps {
	name: string;
	description: string;
	image: string;
	onClick?: () => void;
}

export function ResourceTile({ name, description, image, onClick }: ResourceTileProps) {
	return (
		<Paper
			p="lg"
			radius="md"
			variant="interactive"
			onClick={onClick}
		>
			<Group wrap="nowrap">
				<Image
					src={image}
					w={52}
					h={52}
				/>
				<Box>
					<Text
						c="bright"
						fw={600}
						fz="xl"
					>
						{name}
					</Text>
					<Text mt="xs">{description}</Text>
				</Box>
			</Group>
		</Paper>
	);
}
