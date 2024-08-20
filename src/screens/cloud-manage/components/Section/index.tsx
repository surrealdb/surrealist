import { Box, Stack, Text } from "@mantine/core";
import { PropsWithChildren } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";

export interface SectionProps {
	title: string;
	description?: string;
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
			<PrimaryTitle>
				{title}
			</PrimaryTitle>
			{description && (
				<Text fz="lg">
					{description}
				</Text>
			)}
			<Stack py="xl" maw={withMaxWidth ? 500 : undefined}>
				{children}
			</Stack>
		</Box>
	);
}