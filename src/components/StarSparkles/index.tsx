import { Box } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import classes from "./style.module.scss";

interface Star {
	id: number;
	x: number;
	y: number;
}

export interface StarSparkleProps {
	children: React.ReactNode;
	ref?: React.RefObject<any>;
	hidden?: boolean;
	inset?: number;
	offsetBase?: number;
	offsetModifier?: number;
}

export function StarSparkles({
	hidden,
	children,
	inset = 0,
	offsetBase = 8,
	offsetModifier = 4,
}: StarSparkleProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [stars, setStars] = useState<Star[]>([]);
	const [starId, setStarId] = useState(0);

	useEffect(() => {
		if (!ref.current || hidden) return;

		const interval = setInterval(() => {
			if (!ref.current) return;

			const width = ref.current.offsetWidth;
			const height = ref.current.offsetHeight;

			const baseOffset = offsetBase + Math.random() * offsetModifier;
			const edge = Math.floor(Math.random() * 4);
			let x: number, y: number;

			if (edge === 0) {
				x = Math.random() * width;
				y = -baseOffset + inset;
			} else if (edge === 1) {
				x = width + baseOffset - inset;
				y = Math.random() * height;
			} else if (edge === 2) {
				x = Math.random() * width;
				y = height + baseOffset - inset;
			} else {
				x = -baseOffset + inset;
				y = Math.random() * height;
			}

			const newStar: Star = {
				id: starId,
				x: x,
				y: y,
			};

			setStars((prev) => [...prev, newStar]);
			setStarId((prev) => prev + 1);

			setTimeout(() => {
				setStars((prev) => prev.filter((star) => star.id !== newStar.id));
			}, 3000);
		}, 800);

		return () => clearInterval(interval);
	}, [starId, hidden, inset, offsetBase, offsetModifier]);

	return (
		<div
			className={classes.starContainer}
			ref={ref}
		>
			{children}
			{stars.map((star) => (
				<Box
					key={star.id}
					className={classes.star}
					style={{
						left: `${star.x}px`,
						top: `${star.y}px`,
					}}
				>
					★
				</Box>
			))}
		</div>
	);
}
