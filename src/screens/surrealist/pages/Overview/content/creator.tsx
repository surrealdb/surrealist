import classes from "../style.module.scss";

import { BoxProps, UnstyledButton, Paper, Center, Stack, Text, Flex, Box } from "@mantine/core";
import clsx from "clsx";
import { ReactNode, PropsWithChildren, useRef } from "react";
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
				>
					<Icon
						path={iconPlus}
						size={isCard ? "xl" : "lg"}
						ml={isCard ? 0 : "xs"}
						mr={isCard ? 0 : "xl"}
					/>
					<Box ta={isCard ? "center" : "start"}>
						<Text
							c="bright"
							fw={600}
							fz="lg"
							mt={isCard ? "xs" : 0}
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
