import { ReactNode } from "react";
import { MigrationDiagnosticResult, MigrationResourceType } from "~/types";
import {
	iconAPI,
	iconAuth,
	iconBraces,
	iconBullhorn,
	iconFunction,
	iconIndex,
	iconJSON,
	iconTable,
} from "~/util/icons";

type ResourceTypeMeta = {
	label: string;
	icon: string;
	resource?: (source: MigrationDiagnosticResult) => ReactNode;
};

export const resourceTypeMeta: Record<MigrationResourceType, ResourceTypeMeta> = {
	"kv-user": { label: "Root Users", icon: iconAuth },
	"kv-access": { label: "Root Access Methods", icon: iconAuth },
	"ns-user": { label: "Namespace Users", icon: iconAuth },
	"ns-access": { label: "Namespace Access Methods", icon: iconAuth },
	"db-user": { label: "Database Users", icon: iconAuth },
	"db-api": { label: "APIs", icon: iconAPI },
	"db-access": { label: "Database Access Methods", icon: iconAuth },
	"db-param": { label: "Parameters", icon: iconBraces },
	"db-function": { label: "Functions", icon: iconFunction },
	"db-tb-record": { label: "Table Records", icon: iconTable },
	"db-tb-event": {
		label: "Table Events",
		icon: iconBullhorn,
		resource: (source) => source.origin[5],
	},
	"db-tb-index": {
		label: "Table Indexes",
		icon: iconIndex,
		resource: (source) => source.origin[5],
	},
	"db-tb-field": {
		label: "Table Fields",
		icon: iconJSON,
		resource: (source) => source.origin[5],
	},
};
