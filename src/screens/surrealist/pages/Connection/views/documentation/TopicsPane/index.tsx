import { ScrollArea, Stack, TextInput } from "@mantine/core";
import { Icon, iconAPI, iconSearch } from "@surrealdb/ui";
import { type RefObject, useMemo, useState } from "react";
import { ContentPane } from "~/components/Pane";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import type { DocsTopic } from "~/screens/surrealist/pages/Connection/docs/types";
import { filterDocsTopics } from "~/screens/surrealist/pages/Connection/docs/utils/filter-topics";
import type { CodeLang } from "~/types";
import classes from "./style.module.scss";
import { renderTopics } from "./topics";

export interface TocPaneProps {
	active: string;
	docs: DocsTopic[];
	language: CodeLang;
	scrollRef: RefObject<HTMLDivElement | null>;
}

export function TocPane({ active, docs, scrollRef }: TocPaneProps) {
	const [lang] = useSetting("behavior", "docsLanguage");
	const [search, setSearch] = useState("");

	const filteredDocs = useMemo(() => filterDocsTopics(docs, search, lang), [docs, search, lang]);

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
			<TextInput
				mb="sm"
				leftSection={
					<Icon
						path={iconSearch}
						size="sm"
					/>
				}
				placeholder="Search topics..."
				value={search}
				onChange={(event) => setSearch(event.currentTarget.value)}
				aria-label="Search documentation topics"
			/>

			<ScrollArea
				className={classes.scroller}
				styles={{
					root: {
						position: "absolute",
						inset: 12,
						top: 52,
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
					pb="2xl"
				>
					{renderTopics(filteredDocs, active, lang, onOpen, search.length > 0)}
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}
