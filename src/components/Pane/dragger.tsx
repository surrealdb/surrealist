import { PanelResizeHandle } from "react-resizable-panels";
import classes from "./style.module.scss";

/**
 * Specialized version of PanelResizeHandle with styling applied
 */
export function PanelDragger() {
	return <PanelResizeHandle className={classes.dragger} />;
}
