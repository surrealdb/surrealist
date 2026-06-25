import { Duration, sub } from "date-fns";
import { CLOUD_ROLES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import {
	CloudDeployConfig,
	CloudInstanceType,
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
	public_traffic: true,
	private_traffic: false,
	startingData: {
		type: "none",
	},
});

export const INSTANCE_PLAN_CATEGORIES: Record<InstancePlan, CloudPlanCategories> = {
	free: { compute: ["free", "development", "production"], storage: [] },
	start: { compute: ["development", "production"], storage: [] },
	scale: { compute: ["scale"], storage: [] },
};

export const INSTANCE_PLAN_ARCHITECTURES: Record<InstancePlan, [string, string]> = {
	free: ["Single-node", "Instance"],
	start: ["Single-node", "Instance"],
	scale: ["Multi-node", "Cluster"],
};

export const INSTANCE_CATEGORY_PLANS: Record<string, InstancePlan> = {
	free: "start",
	development: "start",
	production: "start",
	scale: "scale",
};

export const INSTANCE_PLAN_SUGGESTIONS: Record<InstancePlan, string[]> = {
	free: ["free", "small-dev", "medium"],
	start: ["small-dev", "medium", "xlarge"],
	scale: ["medium-scale", "large-scale", "xlarge-scale"],
};

export const BILLING_PROVIDER_ACTIONS: Record<OrganisationBillingProvider, string> = {
	stripe: "You must provide billing and payment details to deploy this instance. This information will be remembered for future deployments in this organisation.",
	aws_marketplace:
		"Please configure your billing and payment information in the AWS Marketplace.",
	bank_transfer:
		"Please contact support to configure billing and payment information for your organisation.",
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

	if (organisation.privatelink_enabled) {
		if (config.public_traffic && config.private_traffic) {
			configuration.access_type = "dual";
		} else if (config.public_traffic) {
			configuration.access_type = "public";
		} else if (config.private_traffic) {
			configuration.access_type = "private";
		}
	}

	return configuration;
}

export function isInstancePlan(plan: string): plan is InstancePlan {
	return Object.keys(INSTANCE_PLAN_CATEGORIES).includes(plan);
}

export function isScalePlan(plan: InstancePlan): boolean {
	return plan === "scale";
}

export function getPlanForInstanceType(
	type: Pick<CloudInstanceType, "slug" | "category">,
): InstancePlan {
	return INSTANCE_CATEGORY_PLANS[type.category] ?? "start";
}

export function isInstanceTypeEnabled(type: CloudInstanceType): boolean {
	if (type.restricted) {
		return false;
	}

	if (type.enabled === false) {
		return false;
	}

	return true;
}

export function getInstanceTypesForPlan(
	registry: Iterable<CloudInstanceType>,
	plan: InstancePlan,
	variant: keyof CloudPlanCategories = "compute",
): CloudInstanceType[] {
	const categories = INSTANCE_PLAN_CATEGORIES[plan][variant];

	return [...registry]
		.filter((type) => categories.includes(type.category))
		.filter(isInstanceTypeEnabled)
		.sort((a, b) => a.price_hour - b.price_hour);
}

export function getFeaturedInstanceTypes(
	registry: Iterable<CloudInstanceType>,
	plan: InstancePlan,
): CloudInstanceType[] {
	const typeBySlug = new Map([...registry].map((type) => [type.slug, type]));

	const fromSuggestions = INSTANCE_PLAN_SUGGESTIONS[plan]
		.map((slug) => typeBySlug.get(slug))
		.filter((type): type is CloudInstanceType => !!type && isInstanceTypeEnabled(type));

	if (fromSuggestions.length > 0) {
		return fromSuggestions.slice(0, 3);
	}

	return getInstanceTypesForPlan(registry, plan).slice(0, 3);
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

export function getBillingProviderAction(organisation: CloudOrganization): string {
	return BILLING_PROVIDER_ACTIONS[organisation.billing_provider] ?? "";
}

export function isOrganisationRestricted(organisation: CloudOrganization): boolean {
	return organisation.state === "freezing" || organisation.state === "frozen";
}

export function isOrganisationTerminated(organisation: CloudOrganization): boolean {
	return organisation.state === "terminating" || organisation.state === "terminated";
}
