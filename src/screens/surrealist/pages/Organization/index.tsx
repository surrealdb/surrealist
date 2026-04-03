import { Alert, Box, Button, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight, iconCreditCard } from "@surrealdb/ui";
import { Redirect } from "wouter";
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
import { useIsAuthenticated } from "~/hooks/cloud";
import { dispatchIntent } from "~/util/intents";
import classes from "./style.module.scss";
import { OrganizationBillingTab } from "./tabs/billing";
import { OrganizationInvoicesTab } from "./tabs/invoices";
import { OrganizationOverviewTab } from "./tabs/overview";
import { OrganizationSettingsTab } from "./tabs/settings";
import { OrganizationSupportTab } from "./tabs/support";
import { OrganizationTeamTab } from "./tabs/team";
import { OrganizationUsageTab } from "./tabs/usage";

const MANAGEMENT_TABS = [
	"overview",
	"team",
	"invoices",
	"billing",
	"support",
	"usage",
	"settings",
] as const;

export interface OrganizationPageProps {
	id: string;
	tab: string;
}

export function OrganizationPage({ id, tab }: OrganizationPageProps) {
	const isAuthed = useIsAuthenticated();

	const { data: organization, isSuccess } = useCloudOrganizationQuery(id);

	const isSupport = organization ? hasOrganizationRoles(organization, ORG_ROLES_SUPPORT) : false;
	const isAdmin = organization ? hasOrganizationRoles(organization, ORG_ROLES_ADMIN) : false;
	const isOwner = organization
		? hasOrganizationRoles(organization, ORG_ROLES_OWNER, true)
		: false;

	const isRestricted = organization ? isOrganisationRestricted(organization) : false;
	const isTerminated = organization ? isOrganisationTerminated(organization) : false;
	const isManagedBilling = organization ? isBillingManaged(organization) : false;

	const activeTab = MANAGEMENT_TABS.includes(tab as (typeof MANAGEMENT_TABS)[number])
		? tab
		: null;

	if (isSuccess && !organization) {
		return <Redirect to="/overview" />;
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
												{ label: organization.name },
											]}
										/>
										{organization.billing_provider === "aws_marketplace" && (
											<Group
												gap="xs"
												mt="xs"
											>
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

									{activeTab === "overview" && (
										<OrganizationOverviewTab organization={organization} />
									)}

									{activeTab === "team" && (
										<OrganizationTeamTab organization={organization} />
									)}

									{activeTab === "invoices" && isOwner && !isManagedBilling && (
										<OrganizationInvoicesTab organization={organization} />
									)}

									{activeTab === "billing" && isOwner && (
										<OrganizationBillingTab organization={organization} />
									)}

									{activeTab === "support" && isSupport && (
										<OrganizationSupportTab organization={organization} />
									)}

									{activeTab === "usage" && isAdmin && (
										<OrganizationUsageTab organization={organization} />
									)}

									{activeTab === "settings" && isAdmin && (
										<OrganizationSettingsTab organization={organization} />
									)}
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
