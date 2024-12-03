import type { ReactNode } from "react";
import { useCloudAuthentication } from "~/hooks/cloud";
import { useConnectionSwitch } from "./hooks/connection";
import { useKeybindListener, useModKeyTracker } from "./hooks/input";
import { useGlobalModals } from "./hooks/modals";
import { useTitleSync } from "./hooks/title";
import { useWindowSettings } from "./hooks/window";
import { useViewSync } from "./hooks/view";
import { useAppRouter } from "./hooks/routing";

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

	return;
}
