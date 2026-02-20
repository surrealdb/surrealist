import { Anchor, Box, BoxProps, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { PropsWithChildren, useRef } from "react";
import { Link } from "wouter";
import { Faint } from "~/components/Faint";

export interface StartCreatorProps extends BoxProps {
	organization?: string;
}

export function StartCreator({ organization, ...other }: PropsWithChildren<StartCreatorProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<Link href={`/o/${organization}/deploy`}>
			<UnstyledButton {...other}>
				<Anchor
					variant="glow"
					c="var(--mantine-color-text)"
				>
					<Paper
						p="xl"
						ref={containerRef}
					>
						<Group
							wrap="nowrap"
							ta="center"
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
								<Text
									mt="xs"
									fz="xs"
								>
									Click to configure and deploy a SurrealDB Cloud instance in this
									organisation.
								</Text>
							</Box>
						</Group>
						<Faint containerRef={containerRef} />
					</Paper>
				</Anchor>
			</UnstyledButton>
		</Link>
	);
}
