import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import { CloudMeasurement, CloudOrganization } from "~/types";

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
 * Format the archive date for the given organization
 */
export function formatArchiveDate(organization: CloudOrganization) {
	if (!organization.archived_at) {
		return "";
	}

	return new Date(organization.archived_at).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
