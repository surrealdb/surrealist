import type { ReactNode } from "react";
import { adapter } from "~/adapter";
import { useAppearanceSettings } from "./hooks/appearance";
import { useConnectionSwitch } from "./hooks/connection";
import { useEscapeKeyListener, useKeybindListener, useModKeyTracker } from "./hooks/input";
import { useIntercom } from "./hooks/intercom";
import { useNativeMenuBar } from "./hooks/menu";
import { usePolicyAlert } from "./hooks/policy";
import { useAppRouter } from "./hooks/routing";
import { useTitleSync } from "./hooks/title";
import { useViewSync } from "./hooks/view";
import { useWindowSettings } from "./hooks/window";

export function Globals(): ReactNode {
	useModKeyTracker();
	useKeybindListener();
	useEscapeKeyListener();
	useWindowSettings();
	useAppearanceSettings();
	useConnectionSwitch();
	useTitleSync();
	useViewSync();
	useAppRouter();
	useIntercom();
	usePolicyAlert();

	if (adapter.id === "desktop" && adapter.platform === "darwin") {
		// biome-ignore lint/correctness/useHookAtTopLevel: Adapters are never mutated
		useNativeMenuBar();
	}

	return;
}
