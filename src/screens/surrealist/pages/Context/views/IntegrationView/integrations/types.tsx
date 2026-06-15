import type { ReactNode } from "react";

export interface IntegrationStep {
	title: ReactNode;
	description: ReactNode;
	action?: "api_keys" | "documentation";
	/** Used when `action` is `documentation`; falls back to a generic docs URL if omitted. */
	documentationUrl?: string;
	code?: string;
	lang?: string;
}
