import { useRef, useEffect, useState, useId } from "react";
import { useStable } from "./stable";
import type { AnimationItem } from "lottie-web";
import { useQuery } from "@tanstack/react-query";

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
	const [isMounted, setIsMounted] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const itemRef = useRef<AnimationItem | null>(null);

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

	const id = useId();

	const { isPending } = useQuery({
		queryKey: ["lottie", id],
		queryFn: async () => {
			const lottie = await import('lottie-web/build/player/lottie_light');

			if (isMounted && ref.current && !ref.current.innerHTML) {
				const item = lottie.default.loadAnimation({
					container: ref.current,
					renderer: 'svg',
					autoplay: false,
					loop: false,
					animationData: options.animation,
					rendererSettings: {
						className: options.className
					},
				});

				itemRef.current = item;
			}
		},
		enabled: isMounted,
	});

	useEffect(() => {
		setIsMounted(true);

		return () => {
			setIsMounted(false);
			itemRef.current?.destroy();
		};
	}, []);

	return {
		isLoading: isPending,
		ref,
		onMouseEnter,
		onMouseLeave,
		item: itemRef.current
	};
}
