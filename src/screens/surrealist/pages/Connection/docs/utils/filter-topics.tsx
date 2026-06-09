import {
	type DocsTopic,
	isArticle,
	isGroup,
	isLink,
	isSection,
} from "~/screens/surrealist/pages/Connection/docs/types";
import type { CodeLang } from "~/types";

function isVisible(topic: DocsTopic, lang: CodeLang) {
	return topic.excludeLanguages?.includes(lang) !== true;
}

function matchesQuery(topic: DocsTopic, query: string) {
	return topic.title.toLowerCase().includes(query);
}

export function filterDocsTopics(topics: DocsTopic[], query: string, lang: CodeLang): DocsTopic[] {
	const q = query.trim().toLowerCase();
	if (!q) return topics;

	const filter = (entries: DocsTopic[]): DocsTopic[] => {
		const result: DocsTopic[] = [];

		for (const entry of entries) {
			if (!isVisible(entry, lang)) continue;

			if (isSection(entry)) {
				const sectionMatches = matchesQuery(entry, q);
				const filteredChildren = filter(entry.topics);

				if (sectionMatches || filteredChildren.length > 0) {
					result.push({
						...entry,
						topics: sectionMatches
							? entry.topics.filter((child) => isVisible(child, lang))
							: filteredChildren,
					});
				}

				continue;
			}

			if (isGroup(entry)) {
				const groupMatches = matchesQuery(entry, q);
				const filteredChildren = filter(entry.children);

				if (groupMatches || filteredChildren.length > 0) {
					result.push({
						...entry,
						children: groupMatches
							? entry.children.filter((child) => isVisible(child, lang))
							: filteredChildren,
					});
				}

				continue;
			}

			if (isLink(entry) || isArticle(entry)) {
				if (matchesQuery(entry, q)) {
					result.push(entry);
				}
			}
		}

		return result;
	};

	return filter(topics);
}
