import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConfigStore } from "~/stores/config";

const API_BASE = `https://surrealdb.com/api`;

interface RemoteListPost {
	id: string;
	slug: string;
	title: string;
	summary: string;
	content?: Record<string, unknown>;
	image_code: string;
	categories: string[];
	publish_date: string;
	blog_url: string;
}

export interface NewsPost {
	id: string;
	slug: string;
	title: string;
	link: string;
	description: string;
	thumbnail: string;
	content: string;
	published: string;
}

function getCdnImageUrl(imageCode: string): string {
	if (imageCode.startsWith("http")) return imageCode;
	return `https://cdn.surrealdb.com/${imageCode}.auto`;
}

function convertRemoteListPost(post: RemoteListPost): NewsPost {
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		link: `https://surrealdb.com${post.blog_url}`,
		description: post.summary,
		thumbnail: getCdnImageUrl(post.image_code),
		content: "",
		published: post.publish_date,
	};
}

/**
 * Fetch the latest news from the SurrealDB blog.
 */
export function useLatestNewsQuery() {
	return useQuery<NewsPost[]>({
		queryKey: ["newsfeed"],
		queryFn: async () => {
			const response = await fetch(`${API_BASE}/feed`, {
				headers: { Accept: "application/json" },
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
			}

			const posts = (await response.json()) as RemoteListPost[];
			return posts.map(convertRemoteListPost);
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
