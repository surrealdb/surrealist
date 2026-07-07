import type { ReactNode } from "react";

export interface IntegrationStep {
	/** Short label shown as the timeline step title. */
	title: ReactNode;
	/**
	 * Markdown body rendered with `MarkdownViewer`. May embed fenced code blocks
	 * (using `~~~` fences) and custom components such as `<ApiKey />` and
	 * `<Documentation />`.
	 */
	description: string;
}
