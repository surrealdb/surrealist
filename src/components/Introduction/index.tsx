import { Box, Center, Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";
import { CodePreview } from "../CodePreview";
import { Icon } from "../Icon";

export interface IntroductionProps {
	title: string;
	icon: string;
	header?: ReactNode;
	snippet?: {
		title?: string;
		code: string;
		language: string;
		dedent?: boolean;
	};
}

export function Introduction({
	title,
	icon,
	header,
	snippet,
	children,
}: PropsWithChildren<IntroductionProps>) {
	return (
		<Center
			h="100%"
			flex={1}
		>
			<Paper
				w={450}
				style={{ overflow: "hidden" }}
				shadow="md"
			>
				{header}
				<Stack
					p="xl"
					gap="xl"
				>
					<Group>
						<Icon
							path={icon}
							size={1.35}
						/>
						<Title c="bright">{title}</Title>
					</Group>
					{children}
				</Stack>
				{snippet?.code && (
					<>
						<Divider />
						<Box p="xl">
							<Text
								c="bright"
								fz={18}
								fw={600}
								mb="md"
							>
								{snippet.title ?? "Example"}
							</Text>
							<CodePreview
								withCopy
								value={snippet.code}
								language={snippet.language}
								withDedent={snippet.dedent !== false}
							/>
						</Box>
					</>
				)}
			</Paper>
		</Center>
	);
}
