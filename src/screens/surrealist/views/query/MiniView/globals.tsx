import type { ReactNode } from "react";
import { useKeybindListener } from "~/components/App/hooks/input";

export function Globals(): ReactNode {
	useKeybindListener();
	return;
}
