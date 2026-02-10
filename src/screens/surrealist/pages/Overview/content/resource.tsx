import { Box, BoxProps, Group, Image, Paper, Text, UnstyledButton } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { useRef } from "react";
import { Faint } from "~/components/Faint";
import classes from "../style.module.scss";

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
			<Paper
				p="lg"
				variant="interactive"
				className={classes.startResource}
				withBorder
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					h="100%"
				>
					<Image
						src={image}
						w={52}
						h={52}
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
		</UnstyledButton>
	);
}
