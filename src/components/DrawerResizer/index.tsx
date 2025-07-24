import { Box, BoxProps } from "@mantine/core";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { clamp } from "~/util/helpers";
import classes from "./style.module.scss";

export interface DrawerResizerProps extends BoxProps {
	minSize: number;
	maxSize: number;
	onResize: (width: number) => void;
}

export function DrawerResizer({ minSize, maxSize, onResize, ...props }: DrawerResizerProps) {
	const [isResizing, setIsResizing] = useState(false);
	const resizer = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onMouseMove = (event: MouseEvent) => {
			if (resizer.current) {
				event.preventDefault();
				onResize(clamp(window.innerWidth - event.clientX, minSize, maxSize));
			}
		};

		const onMouseUp = () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);

			setIsResizing(false);
			document.body.style.cursor = "";
		};

		resizer.current?.addEventListener("mousedown", (event) => {
			event.preventDefault();

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);

			setIsResizing(true);
			document.body.style.cursor = "ew-resize";
		});

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [minSize, maxSize, onResize]);

	return (
		<Box
			ref={resizer}
			pos="absolute"
			left={0}
			top={0}
			bottom={0}
			pr={7}
			className={clsx(classes.root, isResizing && classes.active)}
			{...props}
		>
			<Box
				w={3}
				h="100%"
				className={classes.resizer}
			/>
		</Box>
	);
}
