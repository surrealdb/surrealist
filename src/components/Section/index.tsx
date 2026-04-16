import { Box, Group, Paper, Stack, Text } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";
import { useIsLight } from "~/hooks/theme";

export interface SectionProps {
	title?: ReactNode;
	description?: ReactNode;
	rightSection?: ReactNode;
	withMaxWidth?: boolean;
	withPaper?: boolean;
}

export function Section({
	title,
	description,
	rightSection,
	withMaxWidth,
	withPaper,
	children,
}: PropsWithChildren<SectionProps>) {
	const isLight = useIsLight();

	const inner = (
		<Stack
			py="lg"
			maw={withMaxWidth ? 500 : undefined}
		>
			{children}
		</Stack>
	);

	return (
		<Box>
			{title && (
				<Group>
					<Box flex={1}>
						<Text
							fw={700}
							fz={17}
							c={isLight ? "obsidian.9" : "obsidian.0"}
						>
							{title}
						</Text>
						{description && <Text>{description}</Text>}
					</Box>
					{rightSection}
				</Group>
			)}
			{withPaper ? (
				<Paper
					px="lg"
					mt="sm"
				>
					{inner}
				</Paper>
			) : (
				inner
			)}
		</Box>
	);
}
