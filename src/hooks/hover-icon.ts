import { useRef, useEffect } from "react";
import { useStable } from "./stable";
import lottie, { AnimationItem } from "lottie-web";

export interface HoverIconOptions {
	animation: any;
	className?: string;
	hardReset?: boolean;
}

/**
 * Renders an animated icon that plays on hover, and rewinds
 * when the mouse leaves.
 *
 * @param options animation options
 */
export function useHoverIcon(options: HoverIconOptions) {
	const ref = useRef<HTMLDivElement>(null);
	const itemRef = useRef<AnimationItem|null>(null);

	const hasEnded = useStable(() => {
		const current = itemRef.current?.currentFrame ?? 0;
		const total = itemRef.current?.totalFrames ?? 1;
		return current + 1 == total;
	});

	const onMouseEnter = useStable(() => {
		itemRef.current?.setDirection(1);
		itemRef.current?.setSpeed(1.2);
		itemRef.current?.play();
	});

	const onMouseLeave = useStable(() => {
		if (options.hardReset || hasEnded()) {
			itemRef.current?.goToAndStop(0);
		} else {
			itemRef.current?.setDirection(-1);
			itemRef.current?.setSpeed(1.8);
			itemRef.current?.play();
		}
	});

	useEffect(() => {
		const item = lottie.loadAnimation({
			container: ref.current!,
			renderer: 'svg',
			autoplay: false,
			loop: false,
			animationData: options.animation,
			rendererSettings: {
				className: options.className
			}
		});

		itemRef.current = item;

		return () => {
			itemRef.current?.destroy();
		};
	}, []);

	return {
		ref,
		onMouseEnter,
		onMouseLeave,
		item: itemRef.current
	};
}
