import {
	Box,
	BoxProps,
	Button,
	Divider,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { useWindowEvent } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { capitalize } from "radash";
import { useRef, useState } from "react";
import { adapter } from "~/adapter";
import { fetchAPI, updateCloudInformation } from "~/cloud/api";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { useCloudPaymentsQuery } from "~/cloud/queries/payments";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { showErrorNotification } from "~/util/helpers";
import { iconCreditCard } from "~/util/icons";
import { Icon } from "../Icon";
import { Label } from "../Label";
import { Spacer } from "../Spacer";

export interface PaymentDetailsProps extends BoxProps {
	organisation: CloudOrganization;
}

export function PaymentDetails({ organisation, ...rest }: PaymentDetailsProps) {
	const isOwner = useHasOrganizationRole(organisation.id, "owner");
	const paymentQuery = useCloudPaymentsQuery(organisation.id);
	const client = useQueryClient();

	const [requesting, setRequesting] = useState(false);
	const hasRequested = useRef(false);

	const requestPaymentUrl = useStable(async () => {
		setRequesting(true);
		hasRequested.current = true;

		try {
			const url = await fetchAPI<string>(`/organizations/${organisation.id}/payment/url`);

			adapter.openUrl(url);
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to open payment page",
				content: err,
			});
		} finally {
			setRequesting(false);
		}
	});

	useWindowEvent("focus", async () => {
		const hasPaymentInfo = organisation.payment_info;

		if (!hasRequested.current) return;

		await fetchAPI(`/organizations/${organisation.id}/payment`, {
			method: "PUT",
		});

		await updateCloudInformation();

		client.invalidateQueries({
			queryKey: ["cloud", "payments", organisation.id],
		});

		client.invalidateQueries({
			queryKey: ["cloud", "organizations"],
		});

		if (hasPaymentInfo) {
			tagEvent("cloud_payment_details_updated", { organisation_id: organisation.id });
		} else {
			tagEvent("cloud_payment_details_added", { organisation_id: organisation.id });
		}
	});

	const cardBrand = paymentQuery.data?.info?.card_brand ?? "";
	const cardLast4 = paymentQuery.data?.info?.card_last4 ?? "";
	const cardDescription = `${capitalize(cardBrand)} ending in ${cardLast4}`;

	return (
		<Paper
			p="xl"
			variant="gradient"
			{...rest}
		>
			<Group>
				<Icon
					path={iconCreditCard}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Payment details
				</Text>
				<Spacer />
				{isOwner && (
					<Tooltip
						disabled={organisation.billing_info}
						label="Please provide billing details first"
					>
						<Button
							color="slate"
							variant="light"
							disabled={!organisation.billing_info}
							loading={requesting}
							onClick={requestPaymentUrl}
						>
							Edit
						</Button>
					</Tooltip>
				)}
			</Group>
			<Divider my="md" />
			<Stack mt="md">
				<Box>
					<Label>Payment method</Label>
					<Skeleton visible={paymentQuery.isPending}>
						{organisation.payment_info ? (
							<Text
								c="bright"
								fw={500}
							>
								Credit Card
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
					<Label>Card information</Label>
					<Skeleton visible={paymentQuery.isPending}>
						{organisation.payment_info ? (
							<Text
								c="bright"
								fw={500}
							>
								{cardDescription}
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
