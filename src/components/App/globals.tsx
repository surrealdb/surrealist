import type { ReactNode } from "react";
import { useCloudAuthentication } from "~/hooks/cloud";
import { useConnectionSwitch } from "./hooks/connection";
import { useKeybindListener, useModKeyTracker } from "./hooks/input";
import { useGlobalModals } from "./hooks/modals";
import { useTitleSync } from "./hooks/title";
import { useWindowSettings } from "./hooks/window";

export function Globals(): ReactNode {
	useModKeyTracker();
	useKeybindListener();
	useWindowSettings();
	useConnectionSwitch();
	useCloudAuthentication();
	useGlobalModals();
	useTitleSync();

	return;
}
