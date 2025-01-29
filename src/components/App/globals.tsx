import type { ReactNode } from "react";
import { useCloudAuthentication } from "~/hooks/cloud";
import { useConnectionSwitch } from "./hooks/connection";
import { useKeybindListener, useModKeyTracker } from "./hooks/input";
import { useGlobalModals } from "./hooks/modals";
import { useAppRouter } from "./hooks/routing";
import { useTitleSync } from "./hooks/title";
import { useViewSync } from "./hooks/view";
import { useWindowSettings } from "./hooks/window";
import { useIntercom } from "./hooks/intercom";

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

	return;
}
