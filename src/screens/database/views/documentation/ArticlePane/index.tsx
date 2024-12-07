import {
	type DocsArticleTopic,
	type DocsSectionTopic,
	type DocsTopic,
	isGroup,
	isLink,
	isSection,
} from "~/screens/database/docs/types";

import { Box, Group, ScrollArea, Select, Title } from "@mantine/core";
import { type RefObject, useMemo } from "react";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { ScrollFader } from "~/components/ScrollFader";
import { Spacer } from "~/components/Spacer";
import { DRIVERS } from "~/constants";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { CodeLang } from "~/types";
import { iconCheck, iconList } from "~/util/icons";

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
	const isLight = useIsLight();

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
		const topics = scrollRef.current?.querySelectorAll(
			"[data-topic]",
		) as NodeListOf<HTMLElement>;

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

	const languages = useMemo(() => {
		return DRIVERS.map((driver) => ({
			label: driver.name,
			value: driver.id,
			icon: driver.icon,
		}));
	}, []);

	useIntent("docs-switch-language", ({ lang }) => {
		onLanguageChange(lang as CodeLang);
	});

	const border = isLight
		? "1px solid var(--mantine-color-slate-1)"
		: "1px solid var(--mantine-color-slate-7)";

	return (
		<ContentPane
			icon={iconList}
			title="Documentation"
			withTopPadding={false}
			rightSection={
				<Select
					data={languages}
					value={language}
					onChange={onLanguageChange as any}
					renderOption={({ option, checked }) => {
						const DriverIcon = (option as any).icon;

						return (
							// <Group flex={1}>
							<>
								<DriverIcon height={12} />
								{option.label}
								<Spacer />
								{checked && <Icon path={iconCheck} />}
							</>
						);
					}}
				/>
			}
		>
			<ScrollFader />

			<ScrollArea
				viewportRef={scrollRef}
				onScrollPositionChange={onScroll}
				viewportProps={{
					style: {
						paddingBottom: "50vh",
					},
				}}
				style={{
					position: "absolute",
					inset: 12,
					top: 0,
					right: 0,
					bottom: 0,
					paddingRight: 12,
				}}
			>
				{flattened.map((doc, index) => {
					const Content = doc.component;

					if (isSection(doc)) {
						return (
							<Box
								key={index}
								mx="xl"
								pt={48}
								pb={10}
								data-topic={doc.id}
							>
								<Group
									c="bright"
									my="xl"
								>
									<Icon
										path={doc.icon}
										size={1.65}
									/>
									<Title
										order={1}
										fz={28}
									>
										{doc.title}
									</Title>
								</Group>
								{Content && (
									<Box maw={1500}>
										<Content
											topic={doc}
											language={language}
										/>
									</Box>
								)}
							</Box>
						);
					}

					return (
						Content && (
							<Box
								key={index}
								mx="xl"
								py={42}
								data-topic={doc.id}
								style={{
									borderBottom: index < flattened.length - 1 ? border : "none",
								}}
							>
								<Box maw={1500}>
									<Content
										topic={doc}
										language={language}
									/>
								</Box>
							</Box>
						)
					);
				})}
			</ScrollArea>
		</ContentPane>
	);
}
