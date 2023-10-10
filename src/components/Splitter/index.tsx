import classes from "./style.module.scss";
import { Fragment, useEffect, useRef } from "react";
import { useStable } from "~/hooks/stable";
import { useWindowEvent } from "@mantine/hooks";
import { useState } from "react";
import { Box } from "@mantine/core";

export type SplitDirection = "horizontal" | "vertical";
export type SplitValues = [number | undefined, number | undefined];
export type SplitBounds = SplitValues | number;

export interface SplitterProps {
	startPane?: React.ReactNode;
	endPane?: React.ReactNode;
	children: React.ReactNode;
	direction?: SplitDirection;
	values?: SplitValues;
	minSize?: SplitBounds;
	maxSize?: SplitBounds;
	bufferSize?: number;
	onChange?: (values: SplitValues) => void;
}

const getLeft = (bounds?: SplitBounds) => (typeof bounds === "number" ? bounds : bounds?.[0]);
const getRight = (bounds?: SplitBounds) => (typeof bounds === "number" ? bounds : bounds?.[1]);

export function Splitter(props: SplitterProps) {
	const isHorizontal = props.direction !== "vertical";
	const contents: React.ReactNode[] = [];
	const containerRef = useRef<HTMLDivElement | null>(null);
	const leftPane = useRef<any>();
	const rightPane = useRef<any>();
	const frameId = useRef(0);

	const [draggerId, setDraggerId] = useState<string | null>(null);
	const [leftSize, setLeftSize] = useState(0);
	const [rightSize, setRightSize] = useState(0);

	// Recompute sizes when the container size changes
	const recomputeSizes = useStable((values: SplitValues) => {
		const buffer = props.bufferSize ?? 300;
		const leftReserve = (props.startPane && values[0]) || 0;
		const rightReserve = (props.endPane && values[1]) || 0;
		const totalSize = (isHorizontal ? containerRef.current?.clientWidth : containerRef.current?.clientHeight) || 0;
		
		const clampLeft = (value: number) => clamp(value, getLeft(props.minSize) || 0, getLeft(props.maxSize) || totalSize - rightReserve - buffer);
		const clampRight = (value: number) => clamp(value, getRight(props.minSize) || 0, getRight(props.maxSize) || totalSize - leftReserve - buffer);

		// Calculate actual pane sizes
		const finalLeft = clampLeft(values[0] || 160);
		const finalRight = clampRight(values[1] || 160);
		const field = isHorizontal ? "width" : "height";

		setLeftSize(finalLeft);
		setRightSize(finalRight);

		if (leftPane.current) {
			leftPane.current.style[field] = `${finalLeft}px`;
		}

		if (rightPane.current) {
			rightPane.current.style[field] = `${finalRight}px`;
		}
	});

	// Detect dragged divider
	const onActivate = useStable((id: string) => {
		const { style } = containerRef.current!;

		style.userSelect = "none";
		style.cursor = isHorizontal ? "col-resize" : "row-resize";

		setDraggerId(id);
	});

	useEffect(() => {
		recomputeSizes(props.values || ([] as any));
	}, [props.values, props.startPane, props.endPane]);

	// Stop dragging
	useWindowEvent("mouseup", () => {
		const { style } = containerRef.current!;

		style.userSelect = "";
		style.cursor = "";

		setDraggerId(null);
	});

	// Listen for window resize
	useWindowEvent("resize", () => {
		recomputeSizes([leftSize, rightSize]);
	});

	// Handle mouse dragging
	useEffect(() => {
		const onDrag = (x: number, y: number) => {
			cancelAnimationFrame(frameId.current);

			frameId.current = requestAnimationFrame(() => {
				const bounds = containerRef.current!.getBoundingClientRect();
				const value = isHorizontal ? x - bounds.left : y - bounds.top;
				const total = isHorizontal ? bounds.width : bounds.height;

				if (draggerId === "left") {
					const newLeftSize = value;

					recomputeSizes([newLeftSize, rightSize]);
					props.onChange?.([newLeftSize, rightSize]);
				} else {
					const newRightSize = total - value;

					recomputeSizes([leftSize, newRightSize]);
					props.onChange?.([leftSize, newRightSize]);
				}
			});
		};

		const onMove = (e: MouseEvent) => onDrag(e.clientX, e.clientY);

		if (draggerId) {
			containerRef.current?.addEventListener("mousemove", onMove);
		}

		return () => {
			containerRef.current?.removeEventListener("mousemove", onMove);
		};
	}, [isHorizontal, draggerId]);

	// Display left section
	if (props.startPane) {
		contents.push(
			<Fragment key="left">
				<Box className={classes.leftPane} ref={leftPane}>
					{props.startPane}
				</Box>
				<Divider id="left" isHorizontal={isHorizontal} onActivate={onActivate} />
			</Fragment>
		);
	}

	// Display content
	contents.push(
		<div key="content" className={classes.content}>
			{props.children}
		</div>
	);

	// Display right section
	if (props.endPane) {
		contents.push(
			<Fragment key="right">
				<Divider id="right" isHorizontal={isHorizontal} onActivate={onActivate} />
				<Box className={classes.rightPane} ref={rightPane}>
					{props.endPane}
				</Box>
			</Fragment>
		);
	}

	return (
		<div className={classes.root}>
			<div
				ref={containerRef}
				className={classes.container}
				style={{
					flexDirection: props.direction === "vertical" ? "column" : "row",
				}}>
				{contents}
			</div>
		</div>
	);
}

interface DividerProps {
	id: string;
	isHorizontal: boolean;
	onActivate: (id: string) => void;
}

function Divider(props: DividerProps) {
	const activate = useStable(() => props.onActivate(props.id));
	const className = props.isHorizontal ? classes.dividerVertical : classes.dividerHorizontal;

	return <div className={className} onMouseDown={activate} />;
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}
