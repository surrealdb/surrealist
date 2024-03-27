import { Box, ScrollArea, Select } from "@mantine/core";
import { ContentPane } from "~/components/Pane";
import { DocsArticleTopic, DocsTopic, isGroup, isLink, isSection } from "~/docs/types";
import { RefObject, useMemo } from "react";
import { ScrollFader } from "~/components/ScrollFader";
import { CodeLang } from "~/types";
import { useStable } from "~/hooks/stable";
import { CODE_LANGUAGES } from "~/constants";
import { useIntent } from "~/hooks/url";
import { iconXml } from "~/util/icons";

export interface ArticlePaneProps {
	docs: DocsTopic[];
	language: CodeLang;
	scrollRef: RefObject<HTMLDivElement>;
	onLanguageChange: (lang: CodeLang) => void;
	onChangeActiveTopic: (topic: string) => void;
}

export function ArticlePane({
	docs,
	language,
	scrollRef,
	onLanguageChange,
	onChangeActiveTopic,
}: ArticlePaneProps) {

	const flattened = useMemo(() => {
		const result: DocsArticleTopic[] = [];

		const flatten = (list: DocsTopic[]) => {
			for (const topic of list) {
				if (isLink(topic)) continue;

				if (isSection(topic)) {
					flatten(topic.topics);
					continue;
				}

				if(isGroup(topic)) {
					flatten(topic.children);
					continue;
				}

				result.push(topic);
			}
		};

		flatten(docs);

		return result;
	}, [docs]);

	const onScroll = useStable((position: { x: number; y: number }) => {
		const topics = scrollRef.current?.querySelectorAll("[data-topic]") as NodeListOf<HTMLElement>;

		let activeTopic: HTMLElement | null = null;

		for (const topic of topics) {
			if (topic.offsetTop - 100 > position.y) {
				break;
			}

			activeTopic = topic;
		}

		const topic = activeTopic?.dataset?.topic;

		if (topic) {
			onChangeActiveTopic(topic);
		}
	});

	useIntent("docs-switch-language", ({ lang }) => {
		onLanguageChange(lang as CodeLang);
	});

	return (
		<ContentPane
			icon={iconXml}
			title="Documentation"
			withTopPadding={false}
			rightSection={
				<Select
					data={CODE_LANGUAGES}
					value={language}
					onChange={onLanguageChange as any}
				/>
			}
		>
			<ScrollFader />

			<ScrollArea
				viewportRef={scrollRef}
				onScrollPositionChange={onScroll}
				style={{
					position: "absolute",
					inset: 12,
					top: 0,
					right: 0,
					bottom: 0,
					paddingRight: 12
				}}
			>
				{flattened.map((doc, index) => {
					const Content = doc.component;

					return (
						<Box
							key={index}
							px="xl"
							py={42}
							data-topic={doc.id}
							style={{
								borderBottom: index < flattened.length - 1 ? "1px solid var(--mantine-color-slate-6)" : "none"
							}}
						>
							<Box maw={1500} mx="auto">
								<Content
									topic={doc}
									language={language}
								/>
							</Box>
						</Box>
					);
				})}
			</ScrollArea>
		</ContentPane>
	);
}
