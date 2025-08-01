import { CLOUD_ROLES } from "~/constants";
import { CloudOrganization } from "~/types";

/**
 * Returns whether the current user has the required role in the given organization.
 */
export function useHasOrganizationRole(organisation: CloudOrganization, role: string) {
	const currentRole = organisation.user_role;

	if (!currentRole) {
		return false;
	}

	const required = CLOUD_ROLES.indexOf(role);
	const current = CLOUD_ROLES.indexOf(currentRole ?? "");

	return current >= required;
}
