import type { ContextSettingsViewProps } from "../../types";
import { ConfigurationTab } from "./tabs/Configuration";
import { GeneralTab } from "./tabs/General";
import { PrincipalsTab } from "./tabs/Principals";
import { UsageTab } from "./tabs/Usage";

/**
 * Admin-only Settings surface for a context. The router guarantees that only
 * organization admins/owners reach this view; it simply dispatches to the tab
 * selected by the URL. Each tab uses the Cloud API hooks (control plane), not
 * the Spectron data-plane SDK.
 */
export default function SettingsView({ context, tab }: ContextSettingsViewProps) {
	switch (tab) {
		case "principals":
			return <PrincipalsTab context={context} />;
		case "configuration":
			return <ConfigurationTab context={context} />;
		case "usage":
			return <UsageTab context={context} />;
		default:
			return <GeneralTab context={context} />;
	}
}
