import { Anchor, Box, BoxProps, Group, Image, Paper, Text, UnstyledButton } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { useRef } from "react";
import { Faint } from "~/components/Faint";

export interface StartResourceProps extends BoxProps {
	title: string;
	subtitle?: string;
	image: string;
	onClick: () => void;
}

export function StartResource({ title, subtitle, image, onClick, ...other }: StartResourceProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	return (
		<UnstyledButton
			onClick={onClick}
			{...other}
		>
			<Anchor variant="glow">
				<Paper
					p="lg"
					display="flex"
					style={{
						flexDirection: "column",
					}}
					ref={containerRef}
				>
					<Group
						wrap="nowrap"
						h="100%"
						gap="lg"
					>
						<Image
							src={image}
							w={42}
							h={42}
						/>
						<Box flex={1}>
							<Text
								c="bright"
								fw={600}
								fz="xl"
							>
								{title}
							</Text>
							<Text>{subtitle}</Text>
						</Box>
						<Icon
							path={iconChevronRight}
							ml="md"
						/>
					</Group>
					<Faint containerRef={containerRef} />
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}
