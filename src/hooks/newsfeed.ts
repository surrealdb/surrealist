import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConfigStore } from "~/stores/config";

export interface NewsPost {
	id: string;
	title: string;
	link: string;
	description: string;
	thumbnail: string;
	content: string;
	published: string;
}

/**
 * Fetch the latest news from the SurrealDB blog.
 */
export function useLatestNewsQuery() {
	return useQuery<NewsPost[]>({
		queryKey: ["newsfeed"],
		queryFn: async () => {
			const response = await fetch(`https://surrealdb.com/feed/surrealist.rss`);
			const body = await response.text();
			const result = new DOMParser().parseFromString(body, "text/xml");

			const parseError = result.querySelector("parsererror div")?.textContent;

			if (parseError) {
				throw new Error(parseError);
			}

			return [...result.querySelectorAll("item")].map((item) => ({
				id: item.querySelector("guid")?.textContent || "",
				title: item.querySelector("title")?.textContent || "",
				link: item.querySelector("link")?.textContent || "",
				description: item.querySelector("description")?.textContent || "",
				thumbnail: item.querySelector("content")?.getAttribute("url") || "",
				content: item.querySelector("encoded")?.textContent || "",
				published: item.querySelector("pubDate")?.textContent || "",
			}));
		},
	});
}

/**
 * Returns a list of unread news post ids
 */
export function useUnreadNewsPosts() {
	const lastViewedAt = useConfigStore((s) => s.lastViewedNewsAt);
	const newsQuery = useLatestNewsQuery();

	return useMemo(() => {
		const lastViewed = lastViewedAt ? new Date(lastViewedAt) : new Date();

		return (
			newsQuery.data
				?.filter((item) => new Date(item.published) > lastViewed)
				?.map((item) => item.id) || []
		);
	}, [newsQuery.data, lastViewedAt]);
}
