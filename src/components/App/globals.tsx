import { ReactNode } from "react";
import { useConfigRouting } from "./hooks/routing";
import { useModKeyTracker } from "./hooks/input";
import { useWindowSettings } from "./hooks/window";
import { useCloudAuthentication } from "~/hooks/cloud";
import { useConnectionSwitch } from "./hooks/connection";
import { useTitleSync } from "./hooks/title";

export function Globals(): ReactNode {
	useConfigRouting();
	useModKeyTracker();
	useWindowSettings();
	useConnectionSwitch();
	useCloudAuthentication();
	useTitleSync();

	return;
}