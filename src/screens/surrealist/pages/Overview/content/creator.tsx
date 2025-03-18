import classes from "../style.module.scss";
import clsx from "clsx";

import { Box, BoxProps, Flex, Paper, Text, UnstyledButton } from "@mantine/core";
import { PropsWithChildren, ReactNode, useRef } from "react";

export interface StartCreatorProps extends BoxProps {
	title: ReactNode;
	subtitle: ReactNode;
	onCreate: () => void;
}

export function StartCreator({
	title,
	subtitle,
	onCreate,
	children,
	...other
}: PropsWithChildren<StartCreatorProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton
			onClick={onCreate}
			{...other}
		>
			<Paper
				p="lg"
				ref={containerRef}
				className={clsx(classes.startBox, classes.startCreator)}
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
							// mt={isCard ? "xs" : 0}
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Box>
				</Flex>
			</Paper>
		</UnstyledButton>
	);
}
