import classes from "./style.module.scss";
import { PanelResizeHandle, PanelResizeHandleProps } from "react-resizable-panels";

/**
 * Specialized version of PanelResizeHandle with styling applied
 */
export function PanelDragger(props: PanelResizeHandleProps) {
	return (
		<PanelResizeHandle
			className={classes.dragger}
			{...props}
		/>
	);
}