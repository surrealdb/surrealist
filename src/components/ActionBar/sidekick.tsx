import { Box, Indicator } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "~/hooks/onboarding";
import { useStable } from "~/hooks/stable";
import { iconSidekick } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";
import classes from "./style.module.scss";

interface Star {
	id: number;
	x: number;
	y: number;
}

export function SidekickAction() {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [stars, setStars] = useState<Star[]>([]);
	const [starId, setStarId] = useState(0);
	const [hasExplored, explore] = useOnboarding("sidekick");

	const handleOpen = useStable(() => {
		explore();
		dispatchIntent("open-sidekick");
	});

	useEffect(() => {
		if (!buttonRef.current || hasExplored) return;

		const buttonCenterX = buttonRef.current.offsetWidth / 2;
		const buttonCenterY = buttonRef.current.offsetHeight / 2;

		const interval = setInterval(() => {
			const angle = Math.random() * 2 * Math.PI;
			const radius = 16 + Math.random() * 4;
			const x = buttonCenterX + Math.cos(angle) * radius;
			const y = buttonCenterY + Math.sin(angle) * radius;

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
	}, [starId, hasExplored]);

	return (
		<Indicator disabled={true}>
			<div className={classes.starContainer}>
				<ActionButton
					w={36}
					h={36}
					ref={buttonRef}
					radius="md"
					variant="subtle"
					label="Sidekick AI"
					tooltipProps={{
						position: "bottom",
						label: "Sidekick AI",
						children: null,
					}}
					onClick={handleOpen}
				>
					<Icon
						path={iconSidekick}
						size="lg"
					/>
				</ActionButton>
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
		</Indicator>
	);
}
