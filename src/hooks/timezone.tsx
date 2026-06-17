import type { ConfigType } from "dayjs";
import { useCallback } from "react";
import { useSetting } from "~/hooks/config";
import { formatDateTime, formatWithDayjs, resolveTimeZone, SYSTEM_TIMEZONE } from "~/util/timezone";

export function useTimeZone() {
	return useSetting("behavior", "timeZone")[0] ?? SYSTEM_TIMEZONE;
}

export function useResolvedTimeZone() {
	const [timeZone] = useSetting("behavior", "timeZone");

	return resolveTimeZone(timeZone);
}

export function useFormatDateTime() {
	const resolvedTimeZone = useResolvedTimeZone();

	return useCallback(
		(value: Date | number | string, options?: Intl.DateTimeFormatOptions) => {
			return formatDateTime(value, resolvedTimeZone, options);
		},
		[resolvedTimeZone],
	);
}

export function useFormatWithDayjs() {
	const resolvedTimeZone = useResolvedTimeZone();

	return useCallback(
		(value: ConfigType, format: string) => {
			return formatWithDayjs(value, format, resolvedTimeZone);
		},
		[resolvedTimeZone],
	);
}
