import classes from "../style.module.scss";

import { Box, BoxProps, Flex, Paper, Text, UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren, ReactNode, useRef } from "react";
import { Icon } from "~/components/Icon";
import { ConnectionListMode } from "~/types";
import { iconPlus } from "~/util/icons";

export interface StartCreatorProps extends BoxProps {
	title: ReactNode;
	subtitle: ReactNode;
	presentation: ConnectionListMode;
	onCreate: () => void;
}

export function StartCreator({
	title,
	subtitle,
	presentation,
	onCreate,
	children,
	...other
}: PropsWithChildren<StartCreatorProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isCard = presentation === "card";

	return (
		<UnstyledButton
			onClick={onCreate}
			{...other}
		>
			<Paper
				p="lg"
				ref={containerRef}
				className={clsx(
					classes.startBox,
					classes.startCreator,
					presentation === "row" && classes.startRow,
				)}
			>
				<Flex
					direction={isCard ? "column" : "row"}
					justify={isCard ? "center" : "start"}
					align="center"
					gap={0}
					h="100%"
				>
					<Box ta={isCard ? "center" : "start"}>
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
