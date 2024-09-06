import {
	PanelResizeHandle,
	type PanelResizeHandleProps,
} from "react-resizable-panels";
import classes from "./style.module.scss";

/**
 * Specialized version of PanelResizeHandle with styling applied
 */
export function PanelDragger(props: PanelResizeHandleProps) {
	return <PanelResizeHandle className={classes.dragger} {...props} />;
}
