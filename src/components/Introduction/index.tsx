import { Center, Paper, Stack, Title, Text, Group } from "@mantine/core";
import { CodePreview } from "../CodePreview";
import { PropsWithChildren } from "react";
import { Icon } from "../Icon";
import { Extension } from "@codemirror/state";

export interface IntroductionProps {
	title: string;
	icon: string;
	snippet?: {
		title?: string;
		code?: string;
		extensions?: Extension[];
	};
}

export function Introduction({
	title,
	icon,
	snippet,
	children
}: PropsWithChildren<IntroductionProps>) {
	return (
		<Center h="100%" flex={1}>
			<Paper
				w={450}
				style={{ overflow: "hidden" }}
			>
				<Stack p="xl" gap="xl">
					<Group>
						<Icon path={icon} size={1.35} />
						<Title c="bright">
							{title}
						</Title>
					</Group>
					{children}
				</Stack>
				{snippet?.code && (
					<Paper
						p="xl"
						bg="slate.7"
						radius={0}
					>
						<Text c="bright" fz={18} fw={600} mb="md">
							{snippet.title ?? "Example"}
						</Text>
						<CodePreview
							bg="transparent"
							p={0}
							value={snippet.code}
							extensions={snippet.extensions}
							withDedent
						/>
					</Paper>
				)}
			</Paper>
		</Center>
	);
}