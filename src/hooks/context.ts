import { useFeatureFlags } from "~/util/feature-flags";

export function useSupportTicketsEnvironment(): "production" | "staging" {
	const [flags] = useFeatureFlags();
	return flags.support_tickets_endpoint === "staging" ? "staging" : "production";
}
