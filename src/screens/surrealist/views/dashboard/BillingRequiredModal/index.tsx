import { Group, Alert, Stack, SimpleGrid } from "@mantine/core";
import { openModal, closeModal } from "@mantine/modals";
import { BillingDetails } from "~/components/BillingDetails";
import { PaymentDetails } from "~/components/PaymentDetails";
import { iconArrowDownFat, iconWarning } from "~/util/icons";
import { BillingRequiredBlock } from "./BillingRequiedBlock";
import { Icon } from "~/components/Icon";
import { Text } from "@mantine/core";
import { CloudOrganization } from "~/types";

export function openBillingModal(organization: CloudOrganization | undefined) {
	openModal({
		modalId: "upgrade-billing-information",
		title: (
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
		),
		size: 750,
		trapFocus: false,
		withCloseButton: true,
		children: (
			<>
				{!organization && (
					<Alert
						color="red"
						icon={<Icon path={iconWarning} />}
						title="Organization fetch failed"
					>
						<Text>Failed to fetch organization details. Please try again later!</Text>
					</Alert>
				)}
				{organization && (
					<Stack gap="xl">
						<BillingRequiredBlock
							title="You're almost there!"
							subtitle={
								<Text maw="72%">
									Please provide billing and payment details to proceed with the
									upgrade. This information will be remembered for future upgrades
									and deployments within this organization.
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
								completedCallback={() => {
									if (organization?.billing_info && organization?.payment_info) {
										closeModal("upgrade-billing-information");
									}
								}}
							/>
						</SimpleGrid>
					</Stack>
				)}
			</>
		),
	});
}
