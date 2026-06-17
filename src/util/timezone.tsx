import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Selectable } from "~/types";
import { getSetting } from "./config";

export const SYSTEM_TIMEZONE = "system";

let dayjsConfigured = false;

export function configureDayjs() {
	if (dayjsConfigured) {
		return;
	}

	dayjs.extend(relativeTime);
	dayjs.extend(utc);
	dayjs.extend(timezone);
	dayjsConfigured = true;
}

let cachedTimeZoneOptions: Selectable<string>[] | null = null;

export function getTimeZoneOptions(): Selectable<string>[] {
	if (cachedTimeZoneOptions) {
		return cachedTimeZoneOptions;
	}

	const system = Intl.DateTimeFormat().resolvedOptions().timeZone;

	cachedTimeZoneOptions = [
		{ value: SYSTEM_TIMEZONE, label: `System default (${system})` },
		...Intl.supportedValuesOf("timeZone").map((timeZone) => ({
			value: timeZone,
			label: timeZone.replaceAll("_", " "),
		})),
	];

	return cachedTimeZoneOptions;
}

export function getConfiguredTimeZone(): string {
	return getSetting("behavior", "timeZone") ?? SYSTEM_TIMEZONE;
}

export function resolveTimeZone(timeZone?: string): string | undefined {
	const configured = timeZone ?? getConfiguredTimeZone();

	if (configured === SYSTEM_TIMEZONE) {
		return undefined;
	}

	return configured;
}

export function formatDateTime(
	value: Date | number | string,
	timeZone?: string,
	options?: Intl.DateTimeFormatOptions,
): string {
	const date = value instanceof Date ? value : new Date(value);

	return new Intl.DateTimeFormat(undefined, {
		...options,
		timeZone: resolveTimeZone(timeZone),
	}).format(date);
}

export function formatWithDayjs(value: dayjs.ConfigType, format: string, timeZone?: string) {
	configureDayjs();

	const resolved = resolveTimeZone(timeZone);

	if (resolved) {
		return dayjs(value).tz(resolved).format(format);
	}

	return dayjs(value).format(format);
}
