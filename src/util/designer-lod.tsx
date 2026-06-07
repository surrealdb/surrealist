export interface DiagramLodSettings {
	enabled: boolean;
	threshold: number;
}

export function computeLodLevel(zoomLevel: number, settings: DiagramLodSettings): number {
	if (!settings.enabled) {
		return 1;
	}

	const threshold = Math.max(0.05, settings.threshold);

	if (zoomLevel > threshold * 2.5) {
		return 1;
	}

	if (zoomLevel > threshold * 1.75) {
		return 2;
	}

	if (zoomLevel > threshold) {
		return 3;
	}

	return 4;
}
