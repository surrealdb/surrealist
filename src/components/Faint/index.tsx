import { useMouse } from "@mantine/hooks";
import { type RefObject, useEffect, useRef, useState } from "react";
import faintUrl from "~/assets/images/faint.png";
import { useIsLight } from "~/hooks/theme";

export interface FaintProps {
	containerRef: RefObject<HTMLDivElement>;
}

export function Faint({ containerRef }: FaintProps) {
	const faintRef = useRef<HTMLImageElement>(null);
	const isLight = useIsLight();
	const { x: mouseX, y: mouseY } = useMouse();

	// Track whether we've received a mouse position
	const [hasMouseMoved, setHasMouseMoved] = useState(false);

	// Animation frame ID reference for cleanup
	const animationFrameRef = useRef<number | null>(null);

	// Handle first mouse movement detection
	useEffect(() => {
		if (mouseX > 0 || mouseY > 0) {
			setHasMouseMoved(true);
		}
	}, [mouseX, mouseY]);

	useEffect(() => {
		function updateFaintPosition() {
			const containerEl = containerRef.current;
			const faintEl = faintRef.current;
			if (!containerEl || !faintEl) return;

			// Cache the bounding rectangle to avoid multiple reflows
			const containerRect = containerEl.getBoundingClientRect();

			const container = {
				w: containerEl.clientWidth,
				h: containerEl.clientHeight,
				x: containerRect.left,
				y: containerRect.top,
			};

			const faint = {
				w: faintEl.clientWidth,
				h: faintEl.clientHeight,
			};

			const faintHalfWidth = faint.w / 2;
			const faintHalfHeight = faint.h / 2;

			const relX = mouseX - container.x - faintHalfWidth;
			const relY = mouseY - container.y - faintHalfHeight;

			// Calculate how far outside the container the mouse is
			const outsideX = Math.max(
				0,
				container.x - mouseX,
				mouseX - (container.x + container.w),
			);
			const outsideY = Math.max(
				0,
				container.y - mouseY,
				mouseY - (container.y + container.h),
			);

			const hitX = relX >= -faint.w && relX <= container.w + faint.w;
			const hitY = relY >= -faint.h && relY <= container.h + faint.h;
			const opacityMod = isLight ? 0.3 : 1;

			if (hitX || hitY) {
				// Batch style updates for better performance
				const style = faintEl.style;
				style.left = `${relX}px`;
				style.top = `${relY}px`;

				const outsideMax = Math.max(outsideX, outsideY);

				if (outsideMax === 0) {
					style.transform = "scale(1)";
					style.opacity = `${1 * opacityMod}`;
				} else {
					const scale = 1 - outsideMax / 175;
					const opacity = 1 - outsideMax / 150;
					style.transform = `scale(${scale})`;
					style.opacity = `${opacity * opacityMod}`;
				}
			}

			// Continue the animation loop
			animationFrameRef.current = requestAnimationFrame(updateFaintPosition);
		}

		// Start the animation loop
		animationFrameRef.current = requestAnimationFrame(updateFaintPosition);

		// Cleanup function
		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [containerRef, isLight, mouseX, mouseY]);

	return (
		<img
			ref={faintRef}
			src={faintUrl}
			alt=""
			style={{
				width: 500,
				height: 500,
				position: "absolute",
				top: -500,
				left: -500,
				opacity: 0,
				outline: "none",
				zIndex: -1,
			}}
		/>
	);
}
