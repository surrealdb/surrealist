import { Box, Group, ScrollArea, Select, Title } from "@mantine/core";
import { ContentPane } from "~/components/Pane";
import { DocsArticleTopic, DocsSectionTopic, DocsTopic, isGroup, isLink, isSection } from "~/docs/types";
import { RefObject, useMemo } from "react";
import { ScrollFader } from "~/components/ScrollFader";
import { CodeLang } from "~/types";
import { useStable } from "~/hooks/stable";
import { CODE_LANGUAGES } from "~/constants";
import { useIntent } from "~/hooks/url";
import { iconList } from "~/util/icons";
import { Icon } from "~/components/Icon";

type ReadableArticle = DocsArticleTopic | DocsSectionTopic;

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
		const result: ReadableArticle[] = [];

		const flatten = (list: DocsTopic[]) => {
			const items: ReadableArticle[] = [];

			for (const topic of list) {
				if (topic.excludeLanguages?.includes(language) || isLink(topic)) {
					continue;
				}

				if (isSection(topic)) {
					const children = flatten(topic.topics);

					if (children.length > 0) {
						items.push(topic, ...children);
					}

					continue;
				}

				if (isGroup(topic)) {
					items.push(...flatten(topic.children));
					continue;
				}

				items.push(topic);
			}

			return items;
		};

		result.push(...flatten(docs));

		return result;
	}, [docs, language]);

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
			icon={iconList}
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
				viewportProps={{
					style: {
						paddingBottom: '50vh'
					}
				}}
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
					if (isSection(doc)) {
						return (
							<Box
								key={index}
								mx="xl"
								pt={48}
								pb={10}
								data-topic={doc.id}
							>
								<Group c="bright" my="xl">
									<Icon path={doc.icon} size={1.65}/>
									<Title order={1} fz={28}>
										{doc.title}
									</Title>
								</Group>
							</Box>
						);
					} else {
						const Content = doc.component;

						return (
							<Box
								key={index}
								mx="xl"
								py={42}
								data-topic={doc.id}
								style={{
									borderBottom: index < flattened.length - 1 ? "1px solid var(--mantine-color-slate-7)" : "none"
								}}
							>
								<Box maw={1500}>
									<Content
										topic={doc}
										language={language}
									/>
								</Box>
							</Box>
						);
					}
				})}
			</ScrollArea>
		</ContentPane>
	);
}
