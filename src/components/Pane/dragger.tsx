import classes from "./style.module.scss";
import { PanelResizeHandle } from "react-resizable-panels";

/**
 * Specialized version of PanelResizeHandle with styling applied
 */
export function PanelDragger() {
	return (
		<PanelResizeHandle className={classes.dragger} />
	);
}