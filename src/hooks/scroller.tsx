import { type RefCallback, useCallback, useEffect, useRef, useState } from "react";

export interface UseScrollerOptions {
	/** Amount of pixels to scroll when calling scroll functions, `200` by default */
	scrollAmount?: number;

	/** Determines whether content can be scrolled by dragging with mouse, `true` by default */
	draggable?: boolean;

	/** Called when scroll state changes (canScrollStart or canScrollEnd) */
	onScrollStateChange?: (state: UseScrollerScrollState) => void;
}

export interface UseScrollerScrollState {
	/** Whether content can be scrolled towards the start (left in LTR, right in RTL) */
	canScrollStart: boolean;

	/** Whether content can be scrolled towards the end (right in LTR, left in RTL) */
	canScrollEnd: boolean;
}

export interface UseScrollerReturnValue<T extends HTMLElement = HTMLDivElement> {
	/** Ref callback to attach to the scrollable container element */
	ref: RefCallback<T | null>;

	/** Whether content can be scrolled towards the start */
	canScrollStart: boolean;

	/** Whether content can be scrolled towards the end */
	canScrollEnd: boolean;

	/** Scrolls towards the start direction */
	scrollStart: () => void;

	/** Scrolls towards the end direction */
	scrollEnd: () => void;

	/** `true` if the user is currently dragging the content */
	isDragging: boolean;

	/** Props to spread on the scrollable container for drag functionality */
	dragHandlers: {
		onMouseDown: (event: React.MouseEvent) => void;
		onMouseMove: (event: React.MouseEvent) => void;
		onMouseUp: () => void;
		onMouseLeave: () => void;
	};

	/** Props for a mask wrapper that fades edges when content overflows */
	fadeProps: {
		"data-scroll-start"?: true;
		"data-scroll-end"?: true;
	};

	/** Re-checks overflow and scroll position, e.g. after content changes */
	refresh: () => void;
}

export function useScroller<T extends HTMLElement = HTMLDivElement>(
	options: UseScrollerOptions = {},
): UseScrollerReturnValue<T> {
	const { scrollAmount = 200, draggable = true, onScrollStateChange } = options;

	const containerRef = useRef<T | null>(null);
	const [container, setContainer] = useState<T | null>(null);
	const [canScrollStart, setCanScrollStart] = useState(false);
	const [canScrollEnd, setCanScrollEnd] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const isDraggingRef = useRef(false);
	const hasDraggedRef = useRef(false);
	const startX = useRef(0);
	const scrollLeftStart = useRef(0);
	const onScrollStateChangeRef = useRef(onScrollStateChange);
	onScrollStateChangeRef.current = onScrollStateChange;

	const updateScrollState = useCallback(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		const { scrollLeft, scrollWidth, clientWidth } = container;
		const isRtl = getComputedStyle(container).direction === "rtl";

		let newCanScrollStart: boolean;
		let newCanScrollEnd: boolean;

		if (isRtl) {
			newCanScrollStart = scrollLeft < 0;
			newCanScrollEnd = scrollLeft > -(scrollWidth - clientWidth);
		} else {
			newCanScrollStart = scrollLeft > 0;
			newCanScrollEnd = scrollLeft < scrollWidth - clientWidth - 1;
		}

		setCanScrollStart(newCanScrollStart);
		setCanScrollEnd(newCanScrollEnd);
		onScrollStateChangeRef.current?.({
			canScrollStart: newCanScrollStart,
			canScrollEnd: newCanScrollEnd,
		});
	}, []);

	useEffect(() => {
		if (!container) {
			return;
		}

		updateScrollState();
		container.addEventListener("scroll", updateScrollState);

		const resizeObserver = new ResizeObserver(updateScrollState);
		resizeObserver.observe(container);

		const content = container.firstElementChild;

		if (content) {
			resizeObserver.observe(content);
		}

		return () => {
			container.removeEventListener("scroll", updateScrollState);
			resizeObserver.disconnect();
		};
	}, [container, updateScrollState]);

	const scroll = useCallback(
		(direction: "start" | "end") => {
			const container = containerRef.current;

			if (!container) {
				return;
			}

			const isRtl = getComputedStyle(container).direction === "rtl";
			const amount = direction === "end" ? scrollAmount : -scrollAmount;
			const adjustedScrollBy = isRtl ? -amount : amount;

			container.scrollBy({
				left: adjustedScrollBy,
				behavior: "smooth",
			});
		},
		[scrollAmount],
	);

	const scrollStart = useCallback(() => scroll("start"), [scroll]);
	const scrollEnd = useCallback(() => scroll("end"), [scroll]);

	const handleMouseDown = useCallback(
		(event: React.MouseEvent) => {
			if (!draggable) {
				return;
			}

			const container = containerRef.current;

			if (!container) {
				return;
			}

			isDraggingRef.current = true;
			hasDraggedRef.current = false;
			setIsDragging(true);
			startX.current = event.pageX - container.offsetLeft;
			scrollLeftStart.current = container.scrollLeft;
			container.style.cursor = "grabbing";
			container.style.userSelect = "none";
		},
		[draggable],
	);

	const handleMouseMove = useCallback((event: React.MouseEvent) => {
		if (!isDraggingRef.current) {
			return;
		}

		event.preventDefault();

		const container = containerRef.current;

		if (!container) {
			return;
		}

		const walk = event.pageX - container.offsetLeft - startX.current;

		if (Math.abs(walk) > 5) {
			hasDraggedRef.current = true;
		}

		container.scrollLeft = scrollLeftStart.current - walk;
	}, []);

	const handleMouseUp = useCallback(() => {
		const wasDragged = hasDraggedRef.current;

		isDraggingRef.current = false;
		hasDraggedRef.current = false;
		setIsDragging(false);

		const container = containerRef.current;

		if (!container) {
			return;
		}

		container.style.cursor = "";
		container.style.userSelect = "";

		if (wasDragged) {
			const suppressClick = (event: MouseEvent) => {
				event.stopPropagation();
				event.preventDefault();
				container.removeEventListener("click", suppressClick, true);
			};

			container.addEventListener("click", suppressClick, true);
		}
	}, []);

	const handleMouseLeave = useCallback(() => {
		if (isDraggingRef.current) {
			handleMouseUp();
		}
	}, [handleMouseUp]);

	return {
		ref: useCallback((node: T | null) => {
			containerRef.current = node;
			setContainer(node);
		}, []),
		canScrollStart,
		canScrollEnd,
		scrollStart,
		scrollEnd,
		isDragging,
		dragHandlers: {
			onMouseDown: handleMouseDown,
			onMouseMove: handleMouseMove,
			onMouseUp: handleMouseUp,
			onMouseLeave: handleMouseLeave,
		},
		fadeProps: {
			"data-scroll-start": canScrollStart || undefined,
			"data-scroll-end": canScrollEnd || undefined,
		},
		refresh: updateScrollState,
	};
}
