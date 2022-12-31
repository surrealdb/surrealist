import classes from './style.module.scss';
import { Fragment, useEffect, useRef } from "react";
import { useStable } from '~/hooks/stable';
import { useMove, useWindowEvent } from '@mantine/hooks';
import { useState } from 'react';
import { Box } from '@mantine/core';

export type SplitDirection = 'horizontal' | 'vertical';
export type SplitValues = [number|undefined, number|undefined];
export type SplitBounds = SplitValues | number;

export interface SplitterProps {
	startPane?: React.ReactNode;
	endPane?: React.ReactNode; 
	children: React.ReactNode;
	direction?: SplitDirection;
	values?: SplitValues;
	minSize?: SplitBounds;
	maxSize?: SplitBounds;
	onChange?: (values: SplitValues) => void;
}

export function Splitter(props: SplitterProps) {
	const isHorizontal = (props.direction || 'horizontal') == 'horizontal';
	const contents: React.ReactNode[] = [];
	const draggerRef = useRef<string|null>(null);

	const [sizes, setSizes] = useState(props.values || []);

	useEffect(() => {
		setSizes(props.values || []);
	}, [props.values]);

	// Compute left and right sizes
	const getLeft = (bounds?: SplitBounds) => typeof bounds === 'number' ? bounds : bounds?.[0];
	const getRight = (bounds?: SplitBounds) => typeof bounds === 'number' ? bounds : bounds?.[1];
	const clampLeft = (value: number) => clamp(value, getLeft(props.minSize) || 0, getLeft(props.maxSize) || Infinity);
	const clampRight = (value: number) => clamp(value, getRight(props.minSize) || 0, getRight(props.maxSize) || Infinity);

	const leftSize = clampLeft(sizes[0] || 160);
	const rightSize = clampRight(sizes[1] || 160);

	// Detect dragged divider
	const onActivate = useStable((id: string) => {
		draggerRef.current = id;
		document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
	});

	useWindowEvent('mouseup', () => {
		draggerRef.current = null;
		document.body.style.cursor = '';
	});

	// Handle mouse dragging
	const { ref } = useMove((res) => {
		if (draggerRef.current === null) return;

		const value = isHorizontal ? res.x : res.y;
		const totalSize = isHorizontal ? ref.current.clientWidth : ref.current.clientHeight;

		if (draggerRef.current === 'left') {
			const newLeftSize = clampLeft(value * totalSize);

			setSizes([newLeftSize, rightSize]);
			props.onChange?.([newLeftSize, rightSize]);
		} else {
			const newRightSize = clampRight((1 - value) * totalSize);

			setSizes([leftSize, newRightSize]);
			props.onChange?.([leftSize, newRightSize]);
		}
	});

	// Display left section
	if (props.startPane) {
		const attrs = {
			[isHorizontal ? 'w' : 'h']: leftSize
		};

		contents.push(
			<Fragment key="left">
				<Box
					className={classes.leftPane}
					{...attrs}
				>
					{props.startPane}
				</Box>
				<Divider
					id="left"
					isHorizontal={isHorizontal}
					onActivate={onActivate}
				/>
			</Fragment>
		);
	}

	// Display content
	contents.push(
		<div
			key="content"
			className={classes.content}
		>
			{props.children}
		</div>
	);

	// Display right section
	if (props.endPane) {
		const attrs = {
			[isHorizontal ? 'w' : 'h']: rightSize
		};

		contents.push(
			<Fragment key="right">
				<Divider
					id="right"
					isHorizontal={isHorizontal}
					onActivate={onActivate}
				/>
				<Box
					className={classes.rightPane}
					{...attrs}
				>
					{props.endPane}
				</Box>
			</Fragment>
		);
	}
	
	return (
		<div className={classes.root}>
			<div
				ref={ref}
				className={classes.container}
				style={{
					flexDirection: props.direction === 'vertical' ? 'column' : 'row'
				}}
			>
				{contents}
			</div>
		</div>
	)
}

interface DividerProps {
	id: string;
	isHorizontal: boolean;
	onActivate: (id: string) => void;
}

function Divider(props: DividerProps) {
	const activate = useStable(() => props.onActivate(props.id));
	const className = props.isHorizontal
		? classes.dividerVertical
		: classes.dividerHorizontal;

	return (
		<div
			className={className}
			onMouseDown={activate}
		/>
	)
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}