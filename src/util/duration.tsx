export function surqlDurationToSeconds(duration: string): number {

	// the following duration argument can be formatted as:
	// 0ns, 0us, 0ms, 0s, 0m, 0h, 0d, 0w, 0m, 0y.
	// We want to convert this to seconds.

	if (duration === '') {
		return 0;
	}

	const unit = duration[duration.length - 1];
	const value = Number.parseInt(duration.slice(0, duration.length - 1), 10);

	switch (unit) {
		case 's':
			return value;
		case 'm':
			return value * 60;
		case 'h':
			return value * 60 * 60;
		case 'd':
			return value * 60 * 60 * 24;
		case 'w':
			return value * 60 * 60 * 24 * 7;
		case 'y':
			return value * 60 * 60 * 24 * 365;
		default:
			return value;
	}
}