import { Box, BoxProps, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { PropsWithChildren, useRef } from "react";
import { Link } from "wouter";
import { Faint } from "~/components/Faint";
import { iconChevronRight } from "~/util/icons";
import classes from "../style.module.scss";

export interface StartCreatorProps extends BoxProps {
	organization?: string;
}

export function StartCreator({ organization, ...other }: PropsWithChildren<StartCreatorProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<Link href={`/o/${organization}/deploy`}>
			<UnstyledButton {...other}>
				<Paper
					p="lg"
					ref={containerRef}
					variant="interactive"
					className={classes.startCreator}
					withBorder
				>
					<Group
						wrap="nowrap"
						align="start"
						h="100%"
					>
						<Box flex={1}>
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								Deploy a SurrealDB Cloud instance
							</Text>
							<Text mt="xs">
								Click to configure and deploy a SurrealDB Cloud instance in this
								organisation.
							</Text>
						</Box>

						<Icon
							style={{ alignSelf: "center" }}
							path={iconChevronRight}
							ml="xl"
						/>
					</Group>
					<Faint containerRef={containerRef} />
				</Paper>
			</UnstyledButton>
		</Link>
	);
}
