import { MigrationResourceType } from "~/types";
import {
	iconAPI,
	iconAuth,
	iconBraces,
	iconBroadcastOn,
	iconFunction,
	iconIndex,
	iconTable,
} from "~/util/icons";

export const resourceTypeMeta: Record<MigrationResourceType, { label: string; icon: string }> = {
	"kv-user": { label: "Root Users", icon: iconAuth },
	"kv-access": { label: "Root Access Methods", icon: iconAuth },
	"ns-user": { label: "Namespace Users", icon: iconAuth },
	"ns-access": { label: "Namespace Access Methods", icon: iconAuth },
	"db-user": { label: "Database Users", icon: iconAuth },
	"db-api": { label: "APIs", icon: iconAPI },
	"db-access": { label: "Database Access Methods", icon: iconAuth },
	"db-param": { label: "Parameters", icon: iconBraces },
	"db-function": { label: "Functions", icon: iconFunction },
	"db-tb-event": { label: "Table Events", icon: iconBroadcastOn },
	"db-tb-index": { label: "Table Indexes", icon: iconIndex },
	"db-tb-record": { label: "Tables", icon: iconTable },
};
