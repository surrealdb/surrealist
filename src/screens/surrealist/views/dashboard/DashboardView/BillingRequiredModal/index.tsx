import { Group, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { getBillingProviderName, isBillingManaged, isOrganisationBillable } from "~/cloud/helpers";
import { BillingDetails } from "~/components/BillingDetails";
import { Icon } from "~/components/Icon";
import { PaymentDetails } from "~/components/PaymentDetails";
import { CloudOrganization } from "~/types";
import { iconArrowDownFat } from "~/util/icons";
import { BillingRequiredBlock } from "../BillingRequiredBlock";

export interface BillingRequiredModalProps {
	organization: CloudOrganization;
	opened: boolean;
	onClose: () => void;
	onContinue: () => void;
}

export function BillingRequiredModal({
	organization,
	opened,
	onClose,
	onContinue,
}: BillingRequiredModalProps) {
	const isManaged = isBillingManaged(organization);

	useEffect(() => {
		if (opened && isOrganisationBillable(organization)) {
			onClose();
			onContinue();
		}
	}, [organization, opened, onClose, onContinue]);

	return (
		<Modal
			opened={opened}
			size={750}
			trapFocus={false}
			withCloseButton={true}
			onClose={onClose}
			title={
				<Group>
					<Icon
						path={iconArrowDownFat}
						size="lg"
						c="bright"
						style={{ rotate: "180deg" }}
					/>
					<Text
						fz={18}
						c="bright"
						fw={700}
					>
						Upgrade your instance
					</Text>
				</Group>
			}
		>
			<Stack gap="xl">
				<BillingRequiredBlock
					title="You're almost there!"
					subtitle={
						<Text maw="72%">
							{isManaged
								? `Please configure billing and payment details in ${getBillingProviderName(organization)} to proceed with the upgrade.`
								: `Please provide billing and payment details to proceed with the upgrade. This information will be remembered for future upgrades and deployments within this organization.`}
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
		</Modal>
	);
}
