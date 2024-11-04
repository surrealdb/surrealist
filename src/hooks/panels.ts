import { useLayoutEffect, useRef, useState } from "react";

/**
 * Compute a minimum panel size based on a fixed pixel size.
 *
 * @param minSizePx The minimum size in pixels
 * @returns The minimum size in percentage and a parent ref
 */
export function usePanelMinSize(minSizePx: number, metric?: "width" | "height") {
	const groupRef = useRef<HTMLDivElement | null>(null);
	const [minSize, setMinSize] = useState(0);

	useLayoutEffect(() => {
		const panelGroup = groupRef.current;

		if (!panelGroup) {
			return;
		}

		const resizeHandles = [
			...panelGroup.querySelectorAll<HTMLElement>("[data-panel-resize-handle-id]"),
		].filter((e) => {
			return e.parentNode?.parentNode === panelGroup;
		});

		const observer = new ResizeObserver(() => {
			let size = metric === "height" ? panelGroup.offsetHeight : panelGroup.offsetWidth;

			for (const resizeHandle of resizeHandles) {
				size -= metric === "height" ? resizeHandle.offsetHeight : resizeHandle.offsetWidth;
			}

			if (size > 0) {
				setMinSize((minSizePx / size) * 100);
			}
		});

		observer.observe(panelGroup);

		for (const resizeHandle of resizeHandles) {
			observer.observe(resizeHandle);
		}

		return () => {
			observer.disconnect();
		};
	}, [minSizePx, metric]);

	return [minSize, groupRef] as const;
}
