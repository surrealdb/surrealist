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
 *
 * The "Users" and "Service Accounts" tabs share one component, parameterised by
 * the principal kind each manages; both nest the agent principals owned by their
 * principals.
 */
export default function SettingsView({ context, tab }: ContextSettingsViewProps) {
	switch (tab) {
		case "users":
			return (
				<PrincipalsTab
					context={context}
					kind="human"
				/>
			);
		case "service-accounts":
			return (
				<PrincipalsTab
					context={context}
					kind="service"
				/>
			);
		case "configuration":
			return <ConfigurationTab context={context} />;
		case "usage":
			return <UsageTab context={context} />;
		default:
			return <GeneralTab context={context} />;
	}
}
