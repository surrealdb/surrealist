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
