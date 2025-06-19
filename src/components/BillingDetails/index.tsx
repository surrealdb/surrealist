import { Box, BoxProps, Button, Divider, Group, Paper, Skeleton, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { openBillingDetails } from "~/cloud/modals/billing";
import { useCloudBillingQuery } from "~/cloud/queries/billing";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { iconAccount } from "~/util/icons";
import { Icon } from "../Icon";
import { Label } from "../Label";
import { Spacer } from "../Spacer";

export interface BillingDetails extends BoxProps {
	organisation: CloudOrganization;
}

export function BillingDetails({ organisation, ...rest }: BillingDetails) {
	const isOwner = useHasOrganizationRole(organisation.id, "owner");
	const billingQuery = useCloudBillingQuery(organisation.id);

	const handleEditBilling = useStable(() => {
		openBillingDetails(organisation);
	});

	return (
		<Paper
			p="xl"
			variant="gradient"
			{...rest}
		>
			<Group>
				<Icon
					path={iconAccount}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Billing Details
				</Text>
				<Spacer />
				{isOwner && (
					<Button
						color="slate"
						variant="light"
						onClick={handleEditBilling}
					>
						Edit
					</Button>
				)}
			</Group>
			<Divider my="md" />
			<Stack>
				<Box>
					<Label>Name</Label>
					<Skeleton visible={billingQuery.isPending}>
						{organisation.billing_info ? (
							<Text
								c="bright"
								fw={500}
							>
								{billingQuery.data?.Name}
							</Text>
						) : (
							<Text
								c="slate.4"
								fw={500}
							>
								Not provided yet
							</Text>
						)}
					</Skeleton>
				</Box>
				<Box>
					<Label>Email</Label>
					<Skeleton visible={billingQuery.isPending}>
						{organisation.billing_info ? (
							<Text
								c="bright"
								fw={500}
							>
								{billingQuery.data?.Email}
							</Text>
						) : (
							<Text
								c="slate.4"
								fw={500}
							>
								Not provided yet
							</Text>
						)}
					</Skeleton>
				</Box>
			</Stack>
		</Paper>
	);
}
