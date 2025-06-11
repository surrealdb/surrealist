import type { ReactNode } from "react";
import { useConnectionSwitch } from "./hooks/connection";
import { useKeybindListener, useModKeyTracker } from "./hooks/input";
import { useIntercom } from "./hooks/intercom";
import { useGlobalModals } from "./hooks/modals";
import { usePolicyAlert } from "./hooks/policy";
import { useAppRouter } from "./hooks/routing";
import { useTitleSync } from "./hooks/title";
import { useViewSync } from "./hooks/view";
import { useWindowSettings } from "./hooks/window";
import { useCloudAuthentication } from "./hooks/cloud";

export function Globals(): ReactNode {
	useModKeyTracker();
	useKeybindListener();
	useWindowSettings();
	useConnectionSwitch();
	useCloudAuthentication();
	useGlobalModals();
	useTitleSync();
	useViewSync();
	useAppRouter();
	useIntercom();
	usePolicyAlert();

	return;
}
