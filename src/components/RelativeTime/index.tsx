import { useForceUpdate } from "@mantine/hooks";
import dayjs from "dayjs";
import { useEffect } from "react";

export interface RelativeTimeProps {
	value: number;
}

export function RelativeTime({ value }: RelativeTimeProps) {
	const update = useForceUpdate();

	useEffect(() => {
		const timer = setInterval(() => {
			update();
		}, 60_000);

		return () => clearInterval(timer);
	}, [update]);

	return dayjs(value).fromNow();
}
