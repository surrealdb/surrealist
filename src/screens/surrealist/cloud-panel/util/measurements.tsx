import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CloudMeasurement } from "~/types";

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

		acc.push({
			name: info?.display_name ?? "",
			hours: compute_hours ?? 0,
			cost: (info?.price_hour ?? 0) * (compute_hours ?? 0),
		});

		return acc;
	}, [] as Charge[]);

	const total = summary.reduce((curr, { cost }) => {
		return curr + cost;
	}, 0);

	return { summary, total };
}
