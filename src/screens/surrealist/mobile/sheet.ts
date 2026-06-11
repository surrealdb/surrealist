import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";

/** Which panel the bottom card is currently showing (null = collapsed dock). */
export type CardPanel = "nav" | "account" | "sidekick" | "news";

/** Height of the collapsed dock, in pixels. */
export const DOCK_HEIGHT = 72;

/** Fraction of the viewport height the expanded card occupies. */
const EXPAND_RATIO = 0.85;

/** Movement (px) before a press is treated as a drag rather than a tap. */
const DRAG_THRESHOLD = 4;

/** Fraction of the drag range past which a release snaps open. */
const SNAP_RATIO = 0.35;

export interface CardHandleProps {
	onPointerDown: (event: ReactPointerEvent) => void;
	onPointerMove: (event: ReactPointerEvent) => void;
	onPointerUp: (event: ReactPointerEvent) => void;
	onClick: () => void;
}

export interface BottomCard {
	panel: CardPanel | null;
	setPanel: (panel: CardPanel | null) => void;
	open: (panel: CardPanel) => void;
	collapse: () => void;
	/** Live drag height in px while dragging, otherwise null. */
	height: number | null;
	dragging: boolean;
	/** Reveal fraction: 0 = collapsed, 1 = fully expanded. */
	progress: number;
	/** Props to spread on a drag handle (grab pill or the dock view pill). */
	getHandleProps: () => CardHandleProps;
}

interface DragState {
	startY: number;
	startHeight: number;
	dock: number;
	expanded: number;
	dragging: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Controller for the mobile bottom card: a single sheet that morphs between a
 * collapsed dock and one expanded panel, driven by either taps or a
 * finger-following drag gesture.
 */
export function useBottomCard(): BottomCard {
	const [panel, setPanel] = useState<CardPanel | null>(null);
	const [height, setHeight] = useState<number | null>(null);
	const drag = useRef<DragState | null>(null);
	const liveHeight = useRef<number | null>(null);
	const suppressClick = useRef(false);

	const expandedPx = () => Math.round(window.innerHeight * EXPAND_RATIO);

	const onPointerDown = (event: ReactPointerEvent) => {
		const expanded = expandedPx();

		drag.current = {
			startY: event.clientY,
			startHeight: panel ? expanded : DOCK_HEIGHT,
			dock: DOCK_HEIGHT,
			expanded,
			dragging: false,
		};
	};

	const onPointerMove = (event: ReactPointerEvent) => {
		const state = drag.current;
		if (!state) return;

		const delta = state.startY - event.clientY; // upward drag is positive

		if (!state.dragging && Math.abs(delta) > DRAG_THRESHOLD) {
			state.dragging = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);

			// Reveal the navigation panel while dragging up from the dock
			if (!panel) {
				setPanel("nav");
			}
		}

		if (state.dragging) {
			const next = clamp(state.startHeight + delta, state.dock, state.expanded);
			liveHeight.current = next;
			setHeight(next);
		}
	};

	const onPointerUp = () => {
		const state = drag.current;
		drag.current = null;

		if (!state || !state.dragging) {
			return;
		}

		suppressClick.current = true;

		const finalHeight = liveHeight.current ?? state.startHeight;
		const threshold = state.dock + (state.expanded - state.dock) * SNAP_RATIO;
		const shouldOpen = finalHeight > threshold;

		setPanel((current) => (shouldOpen ? (current ?? "nav") : null));
		liveHeight.current = null;
		setHeight(null);
	};

	const onClick = () => {
		if (suppressClick.current) {
			suppressClick.current = false;
			return;
		}
		setPanel((current) => (current ? null : "nav"));
	};

	const progress =
		height !== null
			? clamp((height - DOCK_HEIGHT) / (expandedPx() - DOCK_HEIGHT), 0, 1)
			: panel
				? 1
				: 0;

	return {
		panel,
		setPanel,
		open: (next) => setPanel(next),
		collapse: () => setPanel(null),
		height,
		dragging: height !== null,
		progress,
		getHandleProps: () => ({ onPointerDown, onPointerMove, onPointerUp, onClick }),
	};
}
