import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";

/** Height of the always-visible bottom bar, in pixels. */
export const BAR_HEIGHT = 64;

/** Movement (px) before a press is treated as a drag rather than a tap. */
const DRAG_THRESHOLD = 4;

export interface BottomSheetHandleProps {
	onPointerDown: (event: ReactPointerEvent) => void;
	onPointerMove: (event: ReactPointerEvent) => void;
	onPointerUp: (event: ReactPointerEvent) => void;
	onClick: () => void;
}

export interface BottomSheet {
	opened: boolean;
	/** Live drag distance in px (0 = fully open) while dragging, otherwise null. */
	offset: number | null;
	/** Ref to attach to the sheet element so its height can be measured. */
	sheetRef: React.RefObject<HTMLDivElement | null>;
	open: () => void;
	close: () => void;
	/** Props to spread onto a drag handle (the menu button or the sheet grabber). */
	getHandleProps: () => BottomSheetHandleProps;
	/** Fraction the sheet is revealed (0 = closed, 1 = fully open). */
	progress: number;
}

interface DragState {
	startY: number;
	startOffset: number;
	closedOffset: number;
	dragging: boolean;
}

/**
 * A small bottom-sheet controller supporting both a tap-to-toggle button and a
 * finger-following drag gesture. The sheet sits directly above the bottom bar,
 * so the closed offset is the sheet's own height plus the bar height.
 */
export function useBottomSheet(): BottomSheet {
	const [opened, setOpened] = useState(false);
	const [offset, setOffset] = useState<number | null>(null);
	const sheetRef = useRef<HTMLDivElement>(null);
	const drag = useRef<DragState | null>(null);
	const liveOffset = useRef<number | null>(null);
	const suppressClick = useRef(false);

	const closedOffset = () => (sheetRef.current?.offsetHeight ?? window.innerHeight) + BAR_HEIGHT;

	const onPointerDown = (event: ReactPointerEvent) => {
		drag.current = {
			startY: event.clientY,
			startOffset: opened ? 0 : closedOffset(),
			closedOffset: closedOffset(),
			dragging: false,
		};
	};

	const onPointerMove = (event: ReactPointerEvent) => {
		const state = drag.current;
		if (!state) return;

		const delta = event.clientY - state.startY;

		if (!state.dragging && Math.abs(delta) > DRAG_THRESHOLD) {
			state.dragging = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);
		}

		if (state.dragging) {
			const next = Math.min(state.closedOffset, Math.max(0, state.startOffset + delta));
			liveOffset.current = next;
			setOffset(next);
		}
	};

	const onPointerUp = () => {
		const state = drag.current;
		drag.current = null;

		if (!state || !state.dragging) {
			return;
		}

		suppressClick.current = true;
		setOpened((liveOffset.current ?? state.startOffset) < state.closedOffset / 2);
		liveOffset.current = null;
		setOffset(null);
	};

	const onClick = () => {
		if (suppressClick.current) {
			suppressClick.current = false;
			return;
		}
		setOpened((value) => !value);
	};

	const progress = offset !== null ? 1 - offset / closedOffset() : opened ? 1 : 0;

	return {
		opened,
		offset,
		sheetRef,
		open: () => setOpened(true),
		close: () => setOpened(false),
		getHandleProps: () => ({ onPointerDown, onPointerMove, onPointerUp, onClick }),
		progress,
	};
}
