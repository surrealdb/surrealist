import { Duration, sub } from "date-fns";
import { useConfigStore } from "~/stores/config";
import { CloudDeployConfig, CloudOrganization, InstancePlan, MetricsDuration } from "~/types";

export const DEFAULT_DEPLOY_CONFIG = Object.freeze<CloudDeployConfig>({
	name: "",
	region: "",
	type: "",
	units: 1,
	version: "",
	plan: "free",
	storageCategory: "standard",
	storageAmount: 100,
	dataset: false,
});

export const INSTANCE_PLAN_CATEGORIES: Record<InstancePlan, string[]> = {
	free: ["free", "development", "production"],
	start: ["development", "production"],
	scale: ["production-memory", "production-compute"],
	enterprise: ["production-memory", "production-compute"],
};

export const INSTANCE_CATEGORY_PLANS: Record<string, InstancePlan> = {
	free: "start",
	development: "start",
	production: "start",
	"production-memory": "enterprise",
	"production-compute": "enterprise",
};

export const INSTANCE_PLAN_SUGGESTIONS: Record<InstancePlan, string[]> = {
	free: ["free", "small-dev", "medium"],
	start: ["small-dev", "medium", "xlarge"],
	scale: ["medium-compute", "large-compute", "xlarge-memory"],
	enterprise: ["medium-compute", "large-compute", "xlarge-memory"],
};

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

	if (config.plan === "scale" || config.plan === "enterprise") {
		configuration.storage = config.storageAmount;
		configuration.distributed_storage_specs = {
			category: config.storageCategory,
			autoscaling: false,
			max_compute_units: config.units,
		};
	}

	return configuration;
}

export function isInstancePlan(plan: string): plan is InstancePlan {
	return Object.keys(INSTANCE_PLAN_CATEGORIES).includes(plan);
}
