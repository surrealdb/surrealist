import { Alert, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useEffect } from "react";
import { BillingDetails } from "~/components/BillingDetails";
import { Icon } from "~/components/Icon";
import { PaymentDetails } from "~/components/PaymentDetails";
import { CloudOrganization } from "~/types";
import { iconCreditCard, iconWarning } from "~/util/icons";
import { BillingRequiredBlock } from "../screens/surrealist/views/dashboard/DashboardView/BillingRequiredBlock";

export function openBillingRequiredModal({
	organization,
	onClose,
	onContinue,
}: BillingRequiredModalProps) {
	return openModal({
		modalId: "billing-required",
		size: 750,
		trapFocus: false,
		withCloseButton: true,
		onClose,
		title: (
			<Group>
				<Icon
					path={iconCreditCard}
					size="lg"
					c="bright"
					style={{ rotate: "180deg" }}
				/>
				<Text
					fz={18}
					c="bright"
					fw={700}
				>
					Billing & payment information required
				</Text>
			</Group>
		),
		children: (
			<>
				<BillingWatcher
					organization={organization}
					onClose={onClose}
					onContinue={onContinue}
				/>
				{!organization ? (
					<Alert
						color="red"
						icon={<Icon path={iconWarning} />}
						title="Organization fetch failed"
					>
						<Text>Failed to fetch organization details. Please try again later!</Text>
					</Alert>
				) : (
					<Stack gap="xl">
						<BillingRequiredBlock
							title="You're almost there!"
							subtitle={
								<Text maw="72%">
									Please provide billing and payment details to proceed. This
									information will be remembered for future upgrades and
									deployments within this organization.
								</Text>
							}
						/>
						<SimpleGrid
							cols={2}
							spacing="xl"
						>
							<BillingDetails
								organisation={organization}
								bg="slate.7"
							/>
							<PaymentDetails
								organisation={organization}
								bg="slate.7"
							/>
						</SimpleGrid>
					</Stack>
				)}
			</>
		),
	});
}

export interface BillingRequiredModalProps {
	organization: CloudOrganization | undefined;
	onClose: () => void;
	onContinue: () => void;
}

function BillingWatcher({ organization, onClose, onContinue }: BillingRequiredModalProps) {
	useEffect(() => {
		if (organization?.billing_info && organization?.payment_info) {
			onClose();
			onContinue();
		}
	}, [organization, onClose, onContinue]);

	return null;
}
