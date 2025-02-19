import classes from "../style.module.scss";

import { BoxProps, UnstyledButton, Paper, Center, Stack, Text } from "@mantine/core";
import clsx from "clsx";
import { ReactNode, PropsWithChildren, useRef } from "react";
import { Icon } from "~/components/Icon";
import { iconPlus } from "~/util/icons";

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
				className={clsx(classes.startBox, classes.startCreator)}
				ref={containerRef}
			>
				<Center h="100%">
					<Stack
						align="center"
						gap={0}
					>
						<Icon path={iconPlus} />
						<Text
							c="bright"
							fw={600}
							fz="lg"
							mt="md"
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Stack>
				</Center>
			</Paper>
		</UnstyledButton>
	);
}
