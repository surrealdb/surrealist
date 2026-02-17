import { Alert, Box, Button, Divider, Group, ScrollArea, Stack, Tabs, Text } from "@mantine/core";
import {
	Icon,
	iconChat,
	iconChevronRight,
	iconCog,
	iconCreditCard,
	iconDollar,
	iconOrganization,
	iconProgressClock,
	iconServer,
} from "@surrealdb/ui";
import { useMemo } from "react";
import { Redirect, useLocation } from "wouter";
import {
	hasOrganizationRoles,
	isBillingManaged,
	isOrganisationRestricted,
	isOrganisationTerminated,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
	ORG_ROLES_SUPPORT,
} from "~/cloud/helpers";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { CloudSplash } from "~/components/CloudSplash";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsAuthenticated } from "~/hooks/cloud";
import { OVERVIEW, Savepoint, useSavepoint } from "~/hooks/overview";
import { dispatchIntent } from "~/util/intents";
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
	const isOwner = organization
		? hasOrganizationRoles(organization, ORG_ROLES_OWNER, true)
		: false;

	const isRestricted = organization ? isOrganisationRestricted(organization) : false;
	const isTerminated = organization ? isOrganisationTerminated(organization) : false;
	const isManagedBilling = organization ? isBillingManaged(organization) : false;

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
							className={classes.content}
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
										<PrimaryTitle
											mt="sm"
											fz={32}
										>
											{organization.name}
										</PrimaryTitle>
										{organization.billing_provider === "aws_marketplace" && (
											<Group gap="xs">
												<Icon
													path={iconChevronRight}
													size="sm"
												/>
												<Text>
													This organisation is managed by{" "}
													<Text
														span
														fw="bold"
													>
														AWS Marketplace
													</Text>
												</Text>
											</Group>
										)}
									</Box>
									{isTerminated ? (
										<Alert
											color="obsidian"
											title="Organisation terminated"
										>
											This organisation has been terminated and is no longer
											available for provisioning new instances.
										</Alert>
									) : isRestricted ? (
										<Alert
											color="red"
											title="Organisation restricted"
											icon={<Icon path={iconCreditCard} />}
										>
											This organisation has been restricted due to failed
											payments. Please update your billing and payment
											information to restore access. If you believe this is a
											mistake or need assistance, please use the button below
											to contact support.
											<div>
												<Button
													mt="md"
													color="red"
													variant="light"
													size="xs"
													onClick={() => {
														dispatchIntent("create-message", {
															type: "conversation",
															conversationType: "general",
															subject: "Organisation restricted",
															message: `My organisation (ID: ${organization.id}) was frozen. Can you please help me restore access?`,
														});
													}}
												>
													Contact support
												</Button>
											</div>
										</Alert>
									) : null}
									<Tabs
										mt="xl"
										variant="gradient"
										value={tab}
										onChange={(value) => {
											if (value) {
												navigate(value);
											}
										}}
									>
										<Tabs.List
											mb="md"
											bg="transparent"
											bd="none"
											w="100%"
										>
											<Tabs.Tab
												flex={1}
												value="instances"
											>
												<Group justify="center">
													<Icon path={iconServer} />
													<Text fz="sm">Instances</Text>
												</Group>
											</Tabs.Tab>
											<Tabs.Tab
												flex={1}
												value="team"
											>
												<Group justify="center">
													<Icon path={iconOrganization} />
													<Text fz="sm">Team</Text>
												</Group>
											</Tabs.Tab>
											{isOwner && !isManagedBilling && (
												<Tabs.Tab
													flex={1}
													value="invoices"
												>
													<Group justify="center">
														<Icon path={iconDollar} />
														<Text fz="sm">Invoices</Text>
													</Group>
												</Tabs.Tab>
											)}
											{isOwner && (
												<Tabs.Tab
													flex={1}
													value="billing"
												>
													<Group justify="center">
														<Icon path={iconCreditCard} />
														<Text fz="sm">Billing</Text>
													</Group>
												</Tabs.Tab>
											)}
											{isSupport && (
												<Tabs.Tab
													flex={1}
													value="support"
												>
													<Group justify="center">
														<Icon path={iconChat} />
														<Text fz="sm">Support</Text>
													</Group>
												</Tabs.Tab>
											)}
											{isAdmin && (
												<>
													<Tabs.Tab
														flex={1}
														value="usage"
													>
														<Group justify="center">
															<Icon path={iconProgressClock} />
															<Text fz="sm">Usage</Text>
														</Group>
													</Tabs.Tab>
													<Tabs.Tab
														flex={1}
														value="settings"
													>
														<Group justify="center">
															<Icon path={iconCog} />
															<Text fz="sm">Settings</Text>
														</Group>
													</Tabs.Tab>
												</>
											)}
										</Tabs.List>

										<Divider mb="xl" />

										<Tabs.Panel value="instances">
											<OrganizationInstancesTab organization={organization} />
										</Tabs.Panel>

										<Tabs.Panel value="team">
											<OrganizationTeamTab organization={organization} />
										</Tabs.Panel>

										{isOwner && !isManagedBilling && (
											<Tabs.Panel value="invoices">
												<OrganizationInvoicesTab
													organization={organization}
												/>
											</Tabs.Panel>
										)}
										{isOwner && (
											<Tabs.Panel value="billing">
												<OrganizationBillingTab
													organization={organization}
												/>
											</Tabs.Panel>
										)}
										{isSupport && (
											<Tabs.Panel value="support">
												<OrganizationSupportTab
													organization={organization}
												/>
											</Tabs.Panel>
										)}
										{isAdmin && (
											<>
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
