import {
	iconChat,
	iconCog,
	iconCreditCard,
	iconDollar,
	iconOrganization,
	iconProgressClock,
	iconServer,
} from "@surrealdb/ui";
import { useMemo } from "react";
import {
	hasOrganizationRoles,
	isBillingManaged,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
	ORG_ROLES_SUPPORT,
} from "~/cloud/helpers";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import {
	type NavigationItem,
	SidebarNavigation,
	SidebarPortal,
	useSidebar,
} from "../../sidebar/portal";

export interface OrganisationSidebarProps {
	organizationId: string;
}

export function OrganisationSidebar({ organizationId }: OrganisationSidebarProps) {
	const { setLocation } = useSidebar();
	const { data: orgData } = useCloudOrganizationQuery(organizationId);

	const isOrgSupport = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_SUPPORT) : false;
	const isOrgAdmin = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_ADMIN) : false;
	const isOrgOwner = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_OWNER, true) : false;
	const isOrgManagedBilling = orgData ? isBillingManaged(orgData) : false;

	const navigation: NavigationItem[][] = useMemo(() => {
		const base = `/o/${organizationId}`;

		const primary: NavigationItem[] = [
			{
				name: "Overview",
				icon: iconServer,
				match: [`${base}/overview`],
				navigate: () => setLocation(`${base}/overview`),
			},
			{
				name: "Team",
				icon: iconOrganization,
				match: [`${base}/team`],
				navigate: () => setLocation(`${base}/team`),
			},
		];

		const billing: NavigationItem[] = [
			...(isOrgOwner && !isOrgManagedBilling
				? [
						{
							name: "Invoices",
							icon: iconDollar,
							match: [`${base}/invoices`],
							navigate: () => setLocation(`${base}/invoices`),
						},
					]
				: []),
			...(isOrgOwner
				? [
						{
							name: "Billing",
							icon: iconCreditCard,
							match: [`${base}/billing`],
							navigate: () => setLocation(`${base}/billing`),
						},
					]
				: []),
			...(isOrgSupport
				? [
						{
							name: "Support",
							icon: iconChat,
							match: [`${base}/support`],
							navigate: () => setLocation(`${base}/support`),
						},
					]
				: []),
		];

		const admin: NavigationItem[] = isOrgAdmin
			? [
					{
						name: "Usage",
						icon: iconProgressClock,
						match: [`${base}/usage`],
						navigate: () => setLocation(`${base}/usage`),
					},
					{
						name: "Settings",
						icon: iconCog,
						match: [`${base}/settings`],
						navigate: () => setLocation(`${base}/settings`),
					},
				]
			: [];

		return [primary, billing, admin].filter((group) => group.length > 0);
	}, [organizationId, isOrgOwner, isOrgManagedBilling, isOrgSupport, isOrgAdmin, setLocation]);

	return (
		<SidebarPortal>
			<SidebarNavigation
				items={navigation}
				backButton={{
					name: "Overview",
					onClick: () => setLocation("/overview"),
				}}
			/>
		</SidebarPortal>
	);
}
