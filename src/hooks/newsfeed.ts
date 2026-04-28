import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getApiBase } from "~/cloud/api/endpoints";
import { useConfigStore } from "~/stores/config";

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

interface RemoteBlogPost {
	id: string;
	slug: string;
	title: string;
	summary: string;
	content: Record<string, unknown>;
	image_code: string;
	categories: string[];
	authors: unknown[];
	created_at: string;
	updated_at: string;
	publish_date: string;
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
			const response = await fetch(`${getApiBase()}/website/v1/blogs`, {
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
 * Fetch the full content of a single blog post by slug.
 */
export function useBlogPostContentQuery(slug: string | null) {
	return useQuery<Record<string, unknown>>({
		queryKey: ["newsfeed", "post", slug],
		enabled: !!slug,
		queryFn: async () => {
			if (!slug) throw new Error("No slug provided");

			const response = await fetch(
				`${getApiBase()}/website/v1/blogs/${encodeURIComponent(slug)}`,
				{ headers: { Accept: "application/json" } },
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch blog post: ${response.statusText}`);
			}

			const post = (await response.json()) as RemoteBlogPost | null;
			const live = (post?.content as { live?: { json?: Record<string, unknown> } })?.live;
			return live?.json ?? {};
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
