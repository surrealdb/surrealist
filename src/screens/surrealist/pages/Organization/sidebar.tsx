import {
	iconChat,
	iconCog,
	iconCreditCard,
	iconDollar,
	iconOrganization,
	iconProgressClock,
	iconServer,
	iconSpectron,
	iconSurreal,
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
import { useHasCloudFeature } from "~/hooks/cloud";
import { optional } from "~/util/helpers";
import {
	type SidebarEntry,
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
	const showContexts = useHasCloudFeature("create_memory_store");

	const isOrgSupport = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_SUPPORT) : false;
	const isOrgAdmin = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_ADMIN) : false;
	const isOrgOwner = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_OWNER, true) : false;
	const isOrgManagedBilling = orgData ? isBillingManaged(orgData) : false;

	const navigation: SidebarEntry[][] = useMemo(() => {
		const base = `/o/${organizationId}`;

		const resources: SidebarEntry[] = [
			{
				name: "Overview",
				icon: iconServer,
				match: [`${base}/overview`],
				onClick: () => setLocation(`${base}/overview`),
			},
			{
				name: "Instances",
				icon: iconSurreal,
				match: [`${base}/instances`],
				onClick: () => setLocation(`${base}/instances`),
			},
			...optional(
				showContexts && {
					name: "Contexts",
					icon: iconSpectron,
					match: [`${base}/contexts`],
					onClick: () => setLocation(`${base}/contexts`),
				},
			),
		];

		const manage: SidebarEntry[] = [
			{
				name: "Team",
				icon: iconOrganization,
				match: [`${base}/team`],
				onClick: () => setLocation(`${base}/team`),
			},
			...optional(
				isOrgOwner &&
					!isOrgManagedBilling && {
						name: "Invoices",
						icon: iconDollar,
						match: [`${base}/invoices`],
						onClick: () => setLocation(`${base}/invoices`),
					},
			),
			...optional(
				isOrgOwner && {
					name: "Billing",
					icon: iconCreditCard,
					match: [`${base}/billing`],
					onClick: () => setLocation(`${base}/billing`),
				},
			),
			...optional(
				isOrgSupport && {
					name: "Support",
					icon: iconChat,
					match: [`${base}/support`],
					onClick: () => setLocation(`${base}/support`),
				},
			),
			...optional(
				isOrgAdmin && {
					name: "Usage",
					icon: iconProgressClock,
					match: [`${base}/usage`],
					onClick: () => setLocation(`${base}/usage`),
				},
			),
		];

		const admin: SidebarEntry[] = optional(
			isOrgAdmin && {
				name: "Settings",
				icon: iconCog,
				match: [`${base}/settings`],
				onClick: () => setLocation(`${base}/settings`),
			},
		);

		return [resources, manage, admin].filter((group) => group.length > 0);
	}, [
		organizationId,
		showContexts,
		isOrgOwner,
		isOrgManagedBilling,
		isOrgSupport,
		isOrgAdmin,
		setLocation,
	]);

	return (
		<SidebarPortal>
			<SidebarNavigation
				items={navigation}
				backButton={{
					name: "Overview",
					onClick: () => setLocation("/"),
				}}
			/>
		</SidebarPortal>
	);
}
