import { SANDBOX } from "~/constants";
import { useConnectionAndView } from "~/hooks/routing";
import { SandboxOnboarding } from "~/modals/onboarding";

export function SandboxModal() {
	const [connection] = useConnectionAndView();

	return <SandboxOnboarding enabled={connection === SANDBOX} />;
}
