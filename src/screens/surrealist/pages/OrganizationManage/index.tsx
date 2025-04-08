import { Badge, Divider, Group, Tabs } from "@mantine/core";
import classes from "./style.module.scss";

import { Box, ScrollArea, Stack } from "@mantine/core";
import { AuthGuard } from "~/components/AuthGuard";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { Icon } from "~/components/Icon";
import {
	iconAccount,
	iconCreditCard,
	iconArrowLeft,
	iconDollar,
	iconProgressClock,
	iconCloud,
	iconServer,
	iconCog,
	iconPackageClosed,
} from "~/util/icons";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { Link, Redirect } from "wouter";
import { ActionButton } from "~/components/ActionButton";
import { OrganizationTeamTab } from "./tabs/team";
import { OrganizationInvoicesTab } from "./tabs/invoices";
import { OrganizationBillingTab } from "./tabs/billing";
import { OrganizationUsageTab } from "./tabs/usage";
import { OrganizationInstancesTab } from "./tabs/instances";
import { OrganizationSettingsTab } from "./tabs/settings";
import { useMemo } from "react";
import { OVERVIEW, Savepoint, useSavepoint } from "~/hooks/overview";

export interface OrganizationManagePageProps {
	id: string;
}

export function OrganizationManagePage({ id }: OrganizationManagePageProps) {
	const { data, isSuccess } = useCloudOrganizationsQuery();
	const organization = data?.find((org) => org.id === id);

	const savepoint = useMemo<Savepoint>(() => {
		if (organization) {
			return { path: `/o/${organization.id}`, name: organization.name };
		}

		return OVERVIEW;
	}, [organization]);

	useSavepoint(savepoint);

	if (isSuccess && !organization) {
		return <Redirect to="/organizations" />;
	}

	return (
		<AuthGuard>
			<Box
				flex={1}
				pos="relative"
			>
				<TopGlow offset={200} />

				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					viewportProps={{
						style: { paddingBottom: 75 },
					}}
				>
					<Stack
						px="xl"
						mx="auto"
						maw={1000}
						mt={75}
					>
						<Group py="md">
							<Link to="/organizations">
								<ActionButton
									label="Back to organizations"
									size="lg"
								>
									<Icon path={iconArrowLeft} />
								</ActionButton>
							</Link>
							<PrimaryTitle fz={26}>{organization?.name}</PrimaryTitle>
							{organization?.archived_at && (
								<Badge
									color="orange"
									variant="light"
									size="lg"
									leftSection={
										<Icon
											path={iconPackageClosed}
											size="sm"
											mr="xs"
										/>
									}
									mb={-2}
								>
									Archived
								</Badge>
							)}
						</Group>

						{organization && (
							<Tabs defaultValue="instances">
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
										leftSection={<Icon path={iconAccount} />}
										px="xl"
									>
										Team
									</Tabs.Tab>
									<Tabs.Tab
										value="invoices"
										leftSection={<Icon path={iconDollar} />}
										px="xl"
									>
										Invoices
									</Tabs.Tab>
									<Tabs.Tab
										value="usage"
										leftSection={<Icon path={iconProgressClock} />}
										px="xl"
									>
										Usage
									</Tabs.Tab>
									<Tabs.Tab
										value="billing"
										leftSection={<Icon path={iconCreditCard} />}
										px="xl"
									>
										Billing
									</Tabs.Tab>
									<Tabs.Tab
										value="settings"
										leftSection={<Icon path={iconCog} />}
										px="xl"
									>
										Settings
									</Tabs.Tab>
								</Tabs.List>

								<Divider my="xl" />

								<Tabs.Panel value="instances">
									<OrganizationInstancesTab organization={organization} />
								</Tabs.Panel>

								<Tabs.Panel value="team">
									<OrganizationTeamTab organization={organization} />
								</Tabs.Panel>

								<Tabs.Panel value="invoices">
									<OrganizationInvoicesTab organization={organization} />
								</Tabs.Panel>

								<Tabs.Panel value="billing">
									<OrganizationBillingTab organization={organization} />
								</Tabs.Panel>

								<Tabs.Panel value="usage">
									<OrganizationUsageTab organization={organization} />
								</Tabs.Panel>

								<Tabs.Panel value="settings">
									<OrganizationSettingsTab organization={organization} />
								</Tabs.Panel>
							</Tabs>
						)}
					</Stack>
				</ScrollArea>
			</Box>
		</AuthGuard>
	);
}
