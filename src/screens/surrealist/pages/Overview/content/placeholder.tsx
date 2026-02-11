import { Anchor, Box, BoxProps, Flex, Paper, Text } from "@mantine/core";
import { PropsWithChildren, ReactNode, useRef } from "react";

export interface StartPlaceholderProps extends BoxProps {
	title: ReactNode;
	subtitle: ReactNode;
}

export function StartPlaceholder({
	title,
	subtitle,
	children,
	...other
}: PropsWithChildren<StartPlaceholderProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<Anchor variant="glow">
			<Paper
				p="lg"
				withBorder
				h={112}
				display="flex"
				style={{
					flexDirection: "column",
				}}
				ref={containerRef}
				{...other}
			>
				<Flex
					direction="column"
					justify="center"
					align="center"
					gap={0}
					h="100%"
				>
					<Box ta="center">
						<Text
							c="bright"
							fw={600}
							fz="lg"
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Box>
				</Flex>
			</Paper>
		</Anchor>
	);
}
