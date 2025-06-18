import { Duration, sub } from "date-fns";
import { useConfigStore } from "~/stores/config";
import { CloudDeployConfig, CloudInstanceType, CloudOrganization, MetricsDuration } from "~/types";

export const DEFAULT_DEPLOY_CONFIG = Object.freeze<CloudDeployConfig>({
	name: "",
	region: "",
	type: "",
	cluster: false,
	units: 1,
	version: "",
	storageCategory: "standard",
	storageAmount: 0,
	dataset: false,
});

export function clearCachedConnections() {
	const { connections } = useConfigStore.getState();

	const pruned = connections.filter((connection) => connection.authentication.mode !== "cloud");

	useConfigStore.setState((s) => {
		s.connections = pruned;
	});
}

const METRIC_DURATION_MAP: Record<MetricsDuration, Duration> = {
	hour: { hours: 1 },
	half: { hours: 12 },
	day: { days: 1 },
	week: { weeks: 1 },
	month: { days: 29 },
};

export function computeMetricRange(duration: MetricsDuration): [Date, Date] {
	const end = new Date();
	const start = sub(end, METRIC_DURATION_MAP[duration]);

	return [start, end];
}

export function isDistributedType(type: CloudInstanceType): boolean {
	return type.category === "production-memory" || type.category === "production-compute";
}

export function compileDeployConfig(
	organisation: CloudOrganization,
	config: CloudDeployConfig,
): object {
	if (!config.type) {
		throw new Error("Deployment type is required to compile configuration.");
	}

	const configuration: Record<string, unknown> = {
		name: config.name,
		org: organisation.id,
		region: config.region,
		specs: {
			slug: config.type,
			version: config.version,
			compute_units: config.type === "free" ? undefined : config.units,
		},
	};

	if (config.cluster) {
		configuration.storage = config.storageAmount;
		configuration.distributed_storage_specs = {
			category: config.storageCategory,
			autoscaling: false,
			max_compute_units: config.units,
		};
	}

	return configuration;
}
