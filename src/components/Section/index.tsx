import { Box, Group, Stack, Text } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsLight } from "~/hooks/theme";

export interface SectionProps {
	title: ReactNode;
	description?: ReactNode;
	rightSection?: ReactNode;
	withMaxWidth?: boolean;
}

export function Section({
	title,
	description,
	rightSection,
	withMaxWidth,
	children,
}: PropsWithChildren<SectionProps>) {
	const isLight = useIsLight();

	return (
		<Box>
			<Group>
				<Box flex={1}>
					<Text
						fw={700}
						fz={17}
						c={isLight ? "slate.9" : "slate.0"}
					>
						{title}
					</Text>
					{description && (
						<Text
							fz="lg"
							mt="xs"
						>
							{description}
						</Text>
					)}
				</Box>
				{rightSection}
			</Group>
			<Stack
				py="xl"
				maw={withMaxWidth ? 500 : undefined}
			>
				{children}
			</Stack>
		</Box>
	);
}
