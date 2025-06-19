import { Alert, Group, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { CloudOrganization } from "~/types";
import { iconArrowDownFat, iconWarning } from "~/util/icons";
import { BillingRequiredBlock } from "../BillingRequiredBlock";
import { BillingDetails } from "~/components/BillingDetails";
import { PaymentDetails } from "~/components/PaymentDetails";
import { useEffect } from "react";

export interface BillingRequiredModalProps {
	organization: CloudOrganization | undefined;
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
	useEffect(() => {
		if (opened && organization?.billing_info && organization?.payment_info) {
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
								Please provide billing and payment details to proceed with the
								upgrade. This information will be remembered for future upgrades and
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
		</Modal>
	);
}
