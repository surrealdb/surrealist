import { ScrollArea, Stack } from "@mantine/core";
import { iconAPI } from "@surrealdb/ui";
import type { RefObject } from "react";
import { ContentPane } from "~/components/Pane";
import { ScrollFader } from "~/components/ScrollFader";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import type { DocsTopic } from "~/screens/surrealist/docs/types";
import type { CodeLang } from "~/types";
import { renderTopics } from "./topics";

export interface TocPaneProps {
	active: string;
	docs: DocsTopic[];
	language: CodeLang;
	scrollRef: RefObject<HTMLDivElement>;
}

export function TocPane({ active, docs, scrollRef }: TocPaneProps) {
	const [lang] = useSetting("behavior", "docsLanguage");

	const onOpen = useStable((topic: string) => {
		scrollRef.current?.querySelector(`[data-topic="${topic}"]`)?.scrollIntoView();
	});

	return (
		<ContentPane
			icon={iconAPI}
			title="Topics"
			withTopPadding={false}
			w={300}
		>
			{/* <TextInput
				leftSection={<Icon path={iconSearch} />}
				placeholder="Search topics..."
				autoFocus
			/> */}

			<ScrollFader />

			<ScrollArea
				styles={{
					root: {
						position: "absolute",
						inset: 12,
						top: 0,
						right: 0,
						bottom: 0,
						paddingRight: 12,
					},
					scrollbar: {
						top: 8,
					},
				}}
			>
				<Stack
					gap="xs"
					my="md"
				>
					{renderTopics(docs, active, lang, onOpen)}
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}
