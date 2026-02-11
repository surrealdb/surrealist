import { Anchor, Badge, Box, Group, Image, Paper, Text } from "@mantine/core";

export interface ResourceTileProps {
	name: string;
	description: string;
	image: string;
	badge?: string;
	onClick?: () => void;
}

export function ResourceTile({ name, description, image, badge, onClick }: ResourceTileProps) {
	return (
		<Anchor
			variant="glow"
			onClick={onClick}
		>
			<Paper
				p="lg"
				radius="md"
				withBorder
			>
				<Group
					wrap="nowrap"
					gap="lg"
				>
					<Image
						src={image}
						w={38}
						h={38}
					/>
					<Box>
						<Group gap="xs">
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								{name}
							</Text>
							{badge && (
								<Badge
									variant="gradient"
									color="violet"
									size="sm"
								>
									{badge}
								</Badge>
							)}
						</Group>
						<Text
							mt="xs"
							fz="xs"
						>
							{description}
						</Text>
					</Box>
				</Group>
			</Paper>
		</Anchor>
	);
}
