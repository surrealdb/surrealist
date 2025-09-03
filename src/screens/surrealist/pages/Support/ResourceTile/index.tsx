import { Badge, Box, Group, Image, Paper, Text } from "@mantine/core";

export interface ResourceTileProps {
	name: string;
	description: string;
	image: string;
	badge?: string;
	onClick?: () => void;
}

export function ResourceTile({ name, description, image, badge, onClick }: ResourceTileProps) {
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
					<Group gap="xs">
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{name}
						</Text>
						{badge && (
							<Badge
								variant="gradient"
								color="surreal"
								size="sm"
							>
								{badge}
							</Badge>
						)}
					</Group>
					<Text mt="xs">{description}</Text>
				</Box>
			</Group>
		</Paper>
	);
}
