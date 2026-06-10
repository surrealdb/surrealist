import { Box, BoxProps, ScrollArea, Stack } from "@mantine/core";
import { PropsWithChildren } from "react";

export function PageContainer({ children, ...other }: PropsWithChildren<BoxProps>) {
	return (
		<Box
			flex={1}
			pos="relative"
			{...other}
		>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
			>
				<Stack
					py="3xl"
					px="xl"
					mx="auto"
					maw={1200}
				>
					{children}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
