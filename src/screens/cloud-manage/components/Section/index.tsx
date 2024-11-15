import { Box, Stack, Text } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";

export interface SectionProps {
	title: ReactNode;
	description?: ReactNode;
	withMaxWidth?: boolean;
}

export function Section({
	title,
	description,
	withMaxWidth,
	children,
}: PropsWithChildren<SectionProps>) {
	return (
		<Box>
			<PrimaryTitle>{title}</PrimaryTitle>
			{description && (
				<Text
					fz="lg"
					mt="xs"
				>
					{description}
				</Text>
			)}
			<Stack
				py="xl"
				maw={withMaxWidth ? 500 : undefined}
			>
				{children}
			</Stack>
		</Box>
	);
}
