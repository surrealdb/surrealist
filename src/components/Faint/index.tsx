import { type RefObject, useEffect, useRef } from "react";
import { adapter, isDesktop } from "~/adapter";
import { useIsLight } from "~/hooks/theme";

export interface FaintProps {
	containerRef: RefObject<HTMLDivElement>;
	debug?: boolean
}

export function Faint({ containerRef, debug }: FaintProps) {
	const disable = adapter.platform !== "windows" && isDesktop; // NOTE Extremely bad performance on Mac WebView
	const faintRef = useRef<HTMLDivElement>(null);
	const isLight = useIsLight();

	useEffect(() => {
		if (disable) return;

		function effect(e: MouseEvent) {
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
			
			const mouseX = e.clientX;
			const mouseY = e.clientY;
			const relX = mouseX - container.x - faintHalfWidth;
			const relY = mouseY - container.y - faintHalfHeight;
			
			// Calculate how far outside the container the mouse is
			const outsideX = Math.max(0, container.x - mouseX, mouseX - (container.x + container.w));
			const outsideY = Math.max(0, container.y - mouseY, mouseY - (container.y + container.h));
		  
			const hitX = relX >= -faint.w && relX <= container.w + faint.w;
			const hitY = relY >= -faint.h && relY <= container.h + faint.h;
		  
			if (hitX || hitY) {
				// Batch style updates for better performance
				const style = faintEl.style;
				style.left = `${relX}px`;
				style.top = `${relY}px`;
			
				const outsideMax = Math.max(outsideX, outsideY);
				
				if (outsideMax === 0) {
					style.transform = 'scale(1)';
					style.filter = 'blur(50px)';
				} else {
					const scale = 1 - outsideMax / 250;
					const blur = 50 + outsideMax * 0.8;
					style.transform = `scale(${scale})`;
					style.filter = `blur(${blur}px)`;
				}
			}
		}

		window.addEventListener("mousemove", effect);

		return () => window.removeEventListener("mousemove", effect);
	}, [disable, containerRef.current]);

	return (
		!disable && (
			<div
				ref={faintRef}
				style={{
					width: "200px",
					height: "200px",
					position: "absolute",
					top: "-200px",
					left: "-200px",
					borderRadius: "100.153px",
					background: "linear-gradient(276deg, #8200E3 42.56%, #FF01A8 78.41%)",
					filter: "blur(40px)",
					opacity: isLight ? 0.5 : 1,
					zIndex: -1,
				}}
			/>
		)
	);
}
