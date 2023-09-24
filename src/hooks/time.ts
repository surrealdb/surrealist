import dayjs from "dayjs";
import { useEffect, useState } from "react";

export function useRelativeTime() {
	const [_, setCounter] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCounter(counter => counter + 1);
		}, 60_000);
		
		return () => clearInterval(timer);
	}, []);

	return (time: number) => dayjs(time).fromNow();
}