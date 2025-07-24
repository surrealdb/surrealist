import { CLOUD_ROLES } from "~/constants";
import { useCloudStore } from "~/stores/cloud";
import { useCloudMembersQuery } from "../queries/members";

/**
 * Returns the users role in the given organization.
 */
export function useOrganizationRole(organizationId: string) {
	const userId = useCloudStore((s) => s.userId);
	const membersQuery = useCloudMembersQuery(organizationId);
	const member = membersQuery.data?.find((member) => member.user_id === userId);

	return member?.role || null;
}

/**
 * Returns whether the current user has the required role in the given organization.
 */
export function useHasOrganizationRole(organizationId: string, role: string) {
	const currentRole = useOrganizationRole(organizationId);

	if (!currentRole) {
		return false;
	}

	const required = CLOUD_ROLES.indexOf(role);
	const current = CLOUD_ROLES.indexOf(currentRole ?? "");

	return current >= required;
}
