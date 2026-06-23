import { adapter } from "~/adapter";
import { CloudBackupPolicySummary, CloudMeasurement } from "~/types";
import { plural } from "./helpers";

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

const BYTE_SIZES = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * Format a millcent value as a USD currency string
 */
export function formatMillcents(millcents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(millcents / 1000);
}

/**
 * Format a byte count as a human-readable size string
 */
export function formatBytesUsage(bytes: number) {
	if (bytes === 0) return "0 B";

	const i = Math.floor(Math.log(bytes) / Math.log(1024));

	return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${BYTE_SIZES[i]}`;
}

/**
 * Format a minute count as hours with one decimal place
 */
export function formatMinutesAsHours(minutes: number) {
	const hours = minutes / 60;
	const rounded = Math.round(hours * 100) / 100;

	return `${new Intl.NumberFormat("en-US").format(rounded)}h`;
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
			return "General purpose";
		case "production-compute":
			return "Compute intensive";
		case "large-scale":
		case "xlarge-scale":
		case "2xlarge-scale":
		case "4xlarge-scale":
			return "Scale";
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
			return "General purpose instances for high performance workloads";
		case "production-compute":
			return "Distributed compute intensive instances for high performance";
		case "large-scale":
		case "xlarge-scale":
		case "2xlarge-scale":
		case "4xlarge-scale":
			return "Distributed instances for scalable production workloads";
		default:
			return category;
	}
}

/**
 * Format backup retention summary for display
 */
export function formatBackupPolicySummary(policy?: CloudBackupPolicySummary) {
	if (!policy) {
		return null;
	}

	const daily = `${policy.daily_retention_days} ${plural(policy.daily_retention_days, "day")}`;
	const weekly = `${policy.weekly_retention_weeks} ${plural(policy.weekly_retention_weeks, "week")}`;
	const monthly = `${policy.monthly_retention_months} ${plural(policy.monthly_retention_months, "month")}`;

	return `${daily} / ${weekly} / ${monthly}`;
}

/**
 * Format backup retention summary in compact form
 */
export function formatBackupPolicySummaryCompact(policy?: CloudBackupPolicySummary) {
	if (!policy) {
		return null;
	}

	return `${policy.daily_retention_days}d / ${policy.weekly_retention_weeks}w / ${policy.monthly_retention_months}m`;
}
