import { Box, Divider, Group, ScrollArea, Stack, Tabs, ThemeIcon, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import { Redirect, useLocation } from "wouter";
import {
	hasOrganizationRoles,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
	ORG_ROLES_SUPPORT,
} from "~/cloud/helpers";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { CloudSplash } from "~/components/CloudSplash";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsAuthenticated } from "~/hooks/cloud";
import { OVERVIEW, Savepoint, useSavepoint } from "~/hooks/overview";
import { formatArchiveDate } from "~/util/cloud";
import {
	iconChat,
	iconCog,
	iconCreditCard,
	iconDollar,
	iconOrganization,
	iconPackageClosed,
	iconProgressClock,
	iconServer,
} from "~/util/icons";
import classes from "./style.module.scss";
import { OrganizationBillingTab } from "./tabs/billing";
import { OrganizationInstancesTab } from "./tabs/instances";
import { OrganizationInvoicesTab } from "./tabs/invoices";
import { OrganizationSettingsTab } from "./tabs/settings";
import { OrganizationSupportTab } from "./tabs/support";
import { OrganizationTeamTab } from "./tabs/team";
import { OrganizationUsageTab } from "./tabs/usage";

export interface OrganizationManagePageProps {
	id: string;
	tab: string;
}

export function OrganizationManagePage({ id, tab }: OrganizationManagePageProps) {
	const isAuthed = useIsAuthenticated();
	const [, navigate] = useLocation();

	const { data: organization, isSuccess } = useCloudOrganizationQuery(id);

	const isSupport = organization ? hasOrganizationRoles(organization, ORG_ROLES_SUPPORT) : false;
	const isAdmin = organization ? hasOrganizationRoles(organization, ORG_ROLES_ADMIN) : false;
	const isOwner = organization ? hasOrganizationRoles(organization, ORG_ROLES_OWNER) : false;

	const savepoint = useMemo<Savepoint>(() => {
		if (organization) {
			return { path: `/o/${organization.id}`, name: organization.name };
		}

		return OVERVIEW;
	}, [organization]);

	useSavepoint(savepoint);

	if (isSuccess && !organization) {
		return <Redirect to="/organisations" />;
	}

	return (
		<AuthGuard>
			{isAuthed ? (
				<Box
					flex={1}
					pos="relative"
				>
					<ScrollArea
						pos="absolute"
						scrollbars="y"
						type="scroll"
						inset={0}
						className={classes.scrollArea}
						mt={18}
					>
						<Stack
							px="xl"
							mx="auto"
							maw={1200}
							pb={68}
						>
							{organization && (
								<>
									<Box>
										<PageBreadcrumbs
											items={[
												{ label: "Surrealist", href: "/overview" },
												{ label: "Organisations", href: "/organisations" },
												{ label: organization.name },
											]}
										/>
										<Group mt="sm">
											<PrimaryTitle fz={32}>{organization.name}</PrimaryTitle>
											{organization?.archived_at && (
												<Tooltip
													label={`Organisation was archived on ${formatArchiveDate(organization)}`}
												>
													<ThemeIcon
														color="orange"
														variant="transparent"
													>
														<Icon
															path={iconPackageClosed}
															size="xl"
														/>
													</ThemeIcon>
												</Tooltip>
											)}
										</Group>
									</Box>
									<Tabs
										mt="xl"
										value={tab}
										onChange={(value) => {
											if (value) {
												navigate(value);
											}
										}}
									>
										<Tabs.List>
											<Tabs.Tab
												value="instances"
												leftSection={<Icon path={iconServer} />}
												px="xl"
											>
												Instances
											</Tabs.Tab>
											<Tabs.Tab
												value="team"
												leftSection={<Icon path={iconOrganization} />}
												px="xl"
											>
												Team
											</Tabs.Tab>
											{isOwner && (
												<>
													<Tabs.Tab
														value="invoices"
														leftSection={<Icon path={iconDollar} />}
														px="xl"
													>
														Invoices
													</Tabs.Tab>

													<Tabs.Tab
														value="billing"
														leftSection={<Icon path={iconCreditCard} />}
														px="xl"
													>
														Billing
													</Tabs.Tab>
												</>
											)}
											{isSupport && (
												<Tabs.Tab
													value="support"
													leftSection={<Icon path={iconChat} />}
													px="xl"
												>
													Support
												</Tabs.Tab>
											)}
											{isAdmin && (
												<>
													<Tabs.Tab
														value="usage"
														leftSection={
															<Icon path={iconProgressClock} />
														}
														px="xl"
													>
														Usage
													</Tabs.Tab>
													<Tabs.Tab
														value="settings"
														leftSection={<Icon path={iconCog} />}
														px="xl"
													>
														Settings
													</Tabs.Tab>
												</>
											)}
										</Tabs.List>

										<Divider my="xl" />

										<Tabs.Panel value="instances">
											<OrganizationInstancesTab organization={organization} />
										</Tabs.Panel>

										<Tabs.Panel value="team">
											<OrganizationTeamTab organization={organization} />
										</Tabs.Panel>

										{isAdmin && (
											<>
												<Tabs.Panel value="invoices">
													<OrganizationInvoicesTab
														organization={organization}
													/>
												</Tabs.Panel>

												<Tabs.Panel value="billing">
													<OrganizationBillingTab
														organization={organization}
													/>
												</Tabs.Panel>

												<Tabs.Panel value="support">
													<OrganizationSupportTab
														organization={organization}
													/>
												</Tabs.Panel>

												<Tabs.Panel value="usage">
													<OrganizationUsageTab
														organization={organization}
													/>
												</Tabs.Panel>
												<Tabs.Panel value="settings">
													<OrganizationSettingsTab
														organization={organization}
													/>
												</Tabs.Panel>
											</>
										)}
									</Tabs>
								</>
							)}
						</Stack>
					</ScrollArea>
				</Box>
			) : (
				<CloudSplash />
			)}
		</AuthGuard>
	);
}
