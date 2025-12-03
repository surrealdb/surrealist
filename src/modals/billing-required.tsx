import { Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useEffect } from "react";
import { getBillingProviderName, isBillingManaged, isOrganisationBillable } from "~/cloud/helpers";
import { BillingDetails } from "~/components/BillingDetails";
import { Icon } from "~/components/Icon";
import { PaymentDetails } from "~/components/PaymentDetails";
import { CloudOrganization } from "~/types";
import { iconCreditCard } from "~/util/icons";
import { BillingRequiredBlock } from "../screens/surrealist/components/BillingRequiredBlock";

export function openBillingRequiredModal({
	organization,
	onClose,
	onContinue,
}: BillingRequiredModalProps) {
	const isManaged = isBillingManaged(organization);

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
				<Stack gap="xl">
					<BillingRequiredBlock
						title="You're almost there!"
						subtitle={
							<Text maw="72%">
								{isManaged
									? `Please configure billing and payment details in ${getBillingProviderName(organization)} to proceed.`
									: `Please provide billing and payment details to proceed. This information will be remembered for future upgrades and deployments within this organization.`}
							</Text>
						}
					/>
					{!isManaged && (
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
					)}
				</Stack>
			</>
		),
	});
}

export interface BillingRequiredModalProps {
	organization: CloudOrganization;
	onClose: () => void;
	onContinue: () => void;
}

function BillingWatcher({ organization, onClose, onContinue }: BillingRequiredModalProps) {
	useEffect(() => {
		if (isOrganisationBillable(organization)) {
			onClose();
			onContinue();
		}
	}, [organization, onClose, onContinue]);

	return null;
}
