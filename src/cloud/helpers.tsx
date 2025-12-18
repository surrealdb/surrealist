import { Duration, sub } from "date-fns";
import { CLOUD_ROLES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import {
	CloudDeployConfig,
	CloudOrganization,
	CloudPlanCategories,
	InstancePlan,
	MetricsDuration,
	OrganisationBillingProvider,
} from "~/types";

export const ORG_ROLES_OWNER = ["owner"];
export const ORG_ROLES_ADMIN = ["admin", "owner"];
export const ORG_ROLES_SUPPORT = ["support_member", "admin", "owner"];

export const DEFAULT_DEPLOY_CONFIG = Object.freeze<CloudDeployConfig>({
	name: "",
	region: "",
	computeType: "",
	computeUnits: 1,
	storageType: "",
	storageUnits: 3,
	storageAmount: 100,
	version: "",
	plan: "free",
	startingData: {
		type: "none",
	},
});

export const INSTANCE_PLAN_CATEGORIES: Record<InstancePlan, CloudPlanCategories> = {
	free: { compute: ["free", "development", "production"], storage: [] },
	start: { compute: ["development", "production"], storage: [] },
	scale: {
		compute: ["production-memory", "production-compute"],
		storage: [],
	},
	enterprise: {
		compute: ["production-memory"],
		storage: ["production"],
	},
};

export const INSTANCE_PLAN_ARCHITECTURES: Record<InstancePlan, [string, string]> = {
	free: ["Single-node", "Instance"],
	start: ["Single-node", "Instance"],
	scale: ["Shared", "Cluster"],
	enterprise: ["Dedicated", "Cluster"],
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
	enterprise: ["medium-memory", "large-memory", "xlarge-memory"],
};

export const BILLING_PROVIDER_NAMES: Record<OrganisationBillingProvider, string> = {
	stripe: "Stripe",
	aws_marketplace: "AWS Marketplace",
	bank_transfer: "Bank Transfer",
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
	if (!config.computeType) {
		throw new Error("Deployment type is required to compile configuration.");
	}

	const configuration: Record<string, unknown> = {
		name: config.name,
		org: organisation.id,
		region: config.region,
		specs: {
			slug: config.computeType,
			version: config.version,
			compute_units: config.computeType === "free" ? undefined : config.computeUnits,
		},
	};

	if (
		config.startingData.type === "restore" &&
		config.startingData.backupOptions &&
		config.startingData.backupOptions.backup &&
		config.startingData.backupOptions.instance
	) {
		configuration.restore_specs = {
			backup_id: config.startingData.backupOptions.backup.snapshot_id,
			instance_id: config.startingData.backupOptions.instance.id,
		};
	}

	if (config.plan !== "free") {
		configuration.storage = config.storageAmount;
	}

	if (isDistributedPlan(config.plan)) {
		configuration.storage = (config.storageAmount * config.storageUnits) / 3;
		configuration.distributed_storage_specs = {
			slug: config.storageType,
			units: config.storageUnits,
			autoscaling: false,
			max_compute_units: config.computeUnits,
		};
	}

	return configuration;
}

export function isInstancePlan(plan: string): plan is InstancePlan {
	return Object.keys(INSTANCE_PLAN_CATEGORIES).includes(plan);
}

export function isDistributedPlan(plan: InstancePlan): boolean {
	return plan === "scale" || plan === "enterprise";
}

export function normalizeRole(role: string): string {
	return role.replace("restricted_", "");
}

export function hasOrganizationRoles(
	organisation: CloudOrganization | undefined,
	roles: string[],
	allowRestricted?: boolean,
) {
	if (!organisation) {
		return false;
	}

	if (roles.some((role) => !CLOUD_ROLES.includes(role))) {
		throw new Error(
			`Tried to check org permissions, but one or more roles were invalid. Received: ${roles.join(", ")}`,
		);
	}

	let currentRole = organisation.user_role;

	if (!currentRole) {
		return false;
	}

	if (allowRestricted) {
		currentRole = normalizeRole(currentRole);
	}

	return roles.includes(currentRole);
}

export function isBillingManaged(organisation: CloudOrganization): boolean {
	return organisation.billing_provider !== "stripe";
}

export function isOrganisationBillable(organisation?: CloudOrganization): boolean {
	if (!organisation) return false;

	return organisation.state === "onboarded";
}

export function getBillingProviderName(organisation: CloudOrganization): string {
	return BILLING_PROVIDER_NAMES[organisation.billing_provider] ?? "[unknown provider]";
}

export function isOrganisationRestricted(organisation: CloudOrganization): boolean {
	return organisation.state === "freezing" || organisation.state === "frozen";
}

export function isOrganisationTerminated(organisation: CloudOrganization): boolean {
	return organisation.state === "terminating" || organisation.state === "terminated";
}
