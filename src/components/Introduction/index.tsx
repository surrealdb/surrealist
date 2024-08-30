import { Center, Paper, Stack, Title, Text, Group } from "@mantine/core";
import { CodePreview } from "../CodePreview";
import { PropsWithChildren, ReactNode } from "react";
import { Icon } from "../Icon";
import { Extension } from "@codemirror/state";
import { useIsLight } from "~/hooks/theme";

export interface IntroductionProps {
	title: string;
	icon: string;
	header?: ReactNode;
	snippet?: {
		title?: string;
		code?: string;
		extensions?: Extension[];
	};
}

export function Introduction({
	title,
	icon,
	header,
	snippet,
	children
}: PropsWithChildren<IntroductionProps>) {
	const isLight = useIsLight();

	return (
		<Center h="100%" flex={1}>
			<Paper
				w={450}
				style={{ overflow: "hidden" }}
				shadow="md"
			>
				{header}
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
						bg={isLight ? "white" : "slate.7"}
						radius={0}
						shadow="none"
						style={{
							borderTop: isLight ? "1px solid var(--mantine-color-slate-1)" : undefined
						}}
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
							withWrapping
						/>
					</Paper>
				)}
			</Paper>
		</Center>
	);
}