import { FC } from "react";
import { CodeLang } from "~/types";

interface BaseDocsTopic {
	id: string;
	title: string;
	excludeLanguages?: CodeLang[];
}

export interface TopicProps {
	topic: DocsArticleTopic;
	language: CodeLang;
}

export interface DocsLinkTopic extends BaseDocsTopic {
	link: string;
}

export interface DocsArticleTopic extends BaseDocsTopic {
	component: FC<TopicProps>;
	extra?: Record<string, any>;
}

export interface DocsGroupTopic extends BaseDocsTopic {
	children: DocsTopic[];
}

export interface DocsSectionTopic extends BaseDocsTopic {
	topics: DocsTopic[];
	icon: string;
}

export type DocsTopic = DocsSectionTopic | DocsLinkTopic | DocsArticleTopic | DocsGroupTopic;
export type Snippets = Partial<Record<CodeLang, string>>;

export function isSection(topic: DocsTopic): topic is DocsSectionTopic {
	return (topic as DocsSectionTopic).topics !== undefined;
}

export function isLink(topic: DocsTopic): topic is DocsLinkTopic {
	return (topic as DocsLinkTopic).link !== undefined;
}

export function isArticle(topic: DocsTopic): topic is DocsArticleTopic {
	return (topic as DocsArticleTopic).component !== undefined;
}

export function isGroup(topic: DocsTopic): topic is DocsGroupTopic {
	return (topic as DocsGroupTopic).children !== undefined;
}
