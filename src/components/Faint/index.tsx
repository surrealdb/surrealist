import { type RefObject, useEffect, useRef } from "react";
import { useIsLight } from "~/hooks/theme";

export interface FaintProps {
	containerRef: RefObject<HTMLDivElement>;
}

export function Faint({
	containerRef
}: FaintProps) {
	const faintRef = useRef<HTMLDivElement>(null);
	const isLight = useIsLight();

	useEffect(() => {
		function effect(e: MouseEvent) {
			if (!containerRef.current || !faintRef.current) return;

			const container = {
				w: containerRef.current.clientWidth,
				h: containerRef.current.clientHeight,
				x: containerRef.current.getBoundingClientRect().left,
				y: containerRef.current.getBoundingClientRect().top,
			};

			const faint = {
				w: faintRef.current.clientWidth,
				h: faintRef.current.clientHeight,
			};

			const mouse = {
				x: e.clientX,
				y: e.clientY,
				relX: e.clientX - container.x - faint.w / 2,
				relY: e.clientY - container.y - faint.h / 2,
			};

			const hitX = mouse.relX >= -faint.w && mouse.relX <= container.w + faint.w;
			const hitY = mouse.relY >= -faint.h && mouse.relY <= container.h + faint.h;

			if (hitX || hitY) {
				faintRef.current.style.left = `${mouse.relX}px`;
				faintRef.current.style.top = `${mouse.relY}px`;
			}
		}

		window.addEventListener("mousemove", effect);

		return () => window.removeEventListener("mousemove", effect);
	}, [containerRef.current]);

	return (
		<div
			ref={faintRef}
			style={{
				width: "150px",
				height: "150px",
				position: "absolute",
				top: "-150px",
				left: "-150px",
				borderRadius: "100.153px",
				background: "linear-gradient(276deg, #8200E3 42.56%, #FF01A8 78.41%)",
				filter: "blur(50px)",
				opacity: isLight ? 0.5 : 1,
				zIndex: -1,
			}}
		/>
	);
}
