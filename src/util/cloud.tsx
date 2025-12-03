import { getCurrentWindow } from "@tauri-apps/api/window";
import { adapter } from "~/adapter";
import { CloudStore, useCloudStore } from "~/stores/cloud";
import { CloudMeasurement } from "~/types";

let skipCloudSync = false;

/**
 * Measure the compute history
 */
export function measureComputeHistory(measurements: CloudMeasurement[]) {
	const entries = measurements.filter(
		({ metric_type, instance_type }) => metric_type === "compute" && instance_type,
	);

	return entries.map(
		({ instance_type, compute_hours }) => [instance_type ?? "", compute_hours ?? 0] as const,
	);
}

/**
 * Measure the total compute hours
 */
export function measureComputeTotal(measurements: CloudMeasurement[]) {
	const entries = measurements.filter(({ metric_type }) => metric_type === "compute");

	return entries.reduce((acc, { compute_hours }) => acc + (compute_hours ?? 0), 0);
}

/**
 * Measure the storage usage in MB
 */
export function measureStorageUsage(measurements: CloudMeasurement[]) {
	const entry = measurements.find(
		({ metric_type, source }) => metric_type === "storage_current" && source === "ebs",
	);

	return (entry?.disk_used_bytes ?? 0) / 1024 / 1024;
}

interface Charge {
	name: string;
	hours: number;
	cost: number;
}

/**
 * Measure the total compute cost
 */
export function measureComputeCost(measurements: CloudMeasurement[]) {
	const { instanceTypes } = useCloudStore.getState();

	const entries = measurements.filter(
		({ metric_type, instance_type }) => metric_type === "compute" && instance_type,
	);

	const summary = entries.reduce((acc, { instance_type, compute_hours }) => {
		const info = instanceTypes.find((t) => t.slug === instance_type);
		const hourlyPriceThousandth = info?.price_hour ?? 0;
		const totalComputeHours = compute_hours ?? 0;
		const instanceCharge = (hourlyPriceThousandth / 1000) * totalComputeHours;

		acc.push({
			name: info?.display_name ?? "",
			hours: totalComputeHours,
			cost: instanceCharge,
		});

		return acc;
	}, [] as Charge[]);

	const total = summary.reduce((curr, { cost }) => {
		return curr + cost;
	}, 0);

	return { summary, total };
}

/**
 * Open the changelog for the given version
 */
export function openSurrealChangelog(version: string) {
	adapter.openUrl(`https://surrealdb.com/releases#v${version.replaceAll(".", "-")}`);
}

/**
 * Returns the display name for the given instance type category
 */
export function getTypeCategoryName(category: string) {
	switch (category) {
		case "free":
			return "Free";
		case "development":
			return "Burstable";
		case "production":
			return "General purpose";
		case "production-memory":
			return "Memory intensive";
		case "production-compute":
			return "Compute intensive";
		default:
			return category;
	}
}

export function getTypeCategoryDescription(category: string) {
	switch (category) {
		case "free":
			return "Explore SurrealDB with a free instance";
		case "development":
			return "Burstable instances for development";
		case "production":
			return "General purpose instances for production workloads";
		case "production-memory":
			return "Distributed memory intensive instances for high throughput";
		case "production-compute":
			return "Distributed compute intensive instances for high performance";
		default:
			return category;
	}
}

export function syncCloudStore(store: CloudStore) {
	if (!skipCloudSync) {
		try {
			skipCloudSync = true;
			useCloudStore.setState(store);
		} finally {
			skipCloudSync = false;
		}
	}
}

export function startCloudSync() {
	useCloudStore.subscribe(async (state) => {
		if (!skipCloudSync) {
			skipCloudSync = true;

			await getCurrentWindow()
				.emit("cloud-updated", state)
				.then(() => {
					skipCloudSync = false;
				});
		}
	});
}
