import type { CloudContext, ContextSettingsTab } from "~/types";

export interface ContextViewProps {
	context: CloudContext;
}

export interface ContextSettingsViewProps extends ContextViewProps {
	tab: ContextSettingsTab;
}
