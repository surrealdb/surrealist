import cloudImg from "~/assets/images/cloud-icon.webp";
import classes from "./style.module.scss";

import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Image,
	LoadingOverlay,
	Paper,
	ScrollArea,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { iconAccount, iconChevronRight, iconCreditCard, iconHelp, iconOpen } from "~/util/icons";

import { useInputState, useWindowEvent } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { capitalize } from "radash";
import { useRef, useState } from "react";
import { adapter } from "~/adapter";
import { fetchAPI, updateCloudInformation } from "~/cloud/api";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useCloudBillingQuery } from "~/cloud/queries/billing";
import { useCloudCouponsQuery } from "~/cloud/queries/coupons";
import { useCloudInvoicesQuery } from "~/cloud/queries/invoices";
import { useCloudPaymentsQuery } from "~/cloud/queries/payments";
import { useCloudOrgUsageQuery } from "~/cloud/queries/usage";
import { CloudSplash } from "~/components/CloudSplash";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import type { CloudCoupon, InvoiceStatus } from "~/types";
import { measureComputeCost } from "~/util/cloud";
import { showError, showInfo } from "~/util/helpers";
import { openBillingDetails } from "../../../../cloud/modals/billing";
import { Section } from "../../../../components/Section";

function isCouponActive(coupon: CloudCoupon) {
	if (coupon.amount_remaining <= 0) {
		return false;
	}

	if (coupon.expires_at === undefined) {
		return true;
	}

	return new Date(coupon.expires_at) > new Date();
}

function getExpiry(coupon: CloudCoupon) {
	if (coupon.expires_at === undefined) {
		return [false, null] as const;
	}

	const expiresAt = new Date(coupon.expires_at);
	const isExpired = expiresAt < new Date();

	return [isExpired, expiresAt] as const;
}

export function BillingPage() {
	const { setSelectedOrganization } = useCloudStore.getState();

	const isAuthed = useIsAuthenticated();
	const organization = useOrganization();
	const organizations = useCloudStore((state) => state.organizations);

	const paymentQuery = useCloudPaymentsQuery(organization?.id);

	const couponQuery = useCloudCouponsQuery(organization?.id);
	const usageQuery = useCloudOrgUsageQuery(organization?.id);
	const queryClient = useQueryClient();

	const [requesting, setRequesting] = useState(false);
	const [coupon, setCoupon] = useInputState("");
	const hasRequested = useRef(false);

	const requestPaymentUrl = useStable(async () => {
		setRequesting(true);
		hasRequested.current = true;

		try {
			const url = await fetchAPI<string>(`/organizations/${organization?.id}/payment/url`);

			adapter.openUrl(url);
		} finally {
			setRequesting(false);
		}
	});

	const redeemCoupon = useStable(async () => {
		try {
			await fetchAPI(`/organizations/${organization?.id}/coupon`, {
				method: "POST",
				body: JSON.stringify(coupon),
			});

			showInfo({
				title: "Discount code applied",
				subtitle: "The discount code has been successfully applied",
			});

			setCoupon("");

			queryClient.invalidateQueries({
				queryKey: ["cloud", "coupons"],
			});
		} catch (err: any) {
			showError({
				title: "Failed to apply discount code",
				subtitle: "The discount code is invalid or has already been applied",
			});
		}
	});

	useWindowEvent("focus", async () => {
		if (!organization || !hasRequested.current) return;

		await fetchAPI(`/organizations/${organization?.id}/payment`, {
			method: "PUT",
		});

		updateCloudInformation();

		queryClient.invalidateQueries({
			queryKey: ["cloud", "payments", organization.id],
		});
	});

	const cardBrand = paymentQuery.data?.info?.card_brand ?? "";
	const cardLast4 = paymentQuery.data?.info?.card_last4 ?? "";
	const cardDescription = `${capitalize(cardBrand)} ending in ${cardLast4}`;
	const usageCharge = measureComputeCost(usageQuery.data ?? []);

	const coupons = (couponQuery.data ?? []).sort((a, b) => {
		const aActive = isCouponActive(a);
		const bActive = isCouponActive(b);

		if (aActive && !bActive) {
			return -1;
		}

		if (!aActive && bActive) {
			return 1;
		}

		return 0;
	});

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			{isAuthed ? (
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
						gap={42}
						mx="auto"
						maw={1100}
						mt={75}
					>
						<Group>
							<Box>
								<PrimaryTitle fz={26}>Cloud Billing</PrimaryTitle>
								<Text fz="xl">View and manage your billing information</Text>
							</Box>
							<Spacer />
							<Select
								value={organization?.id ?? ""}
								onChange={setSelectedOrganization as any}
								data={organizations.map((org) => ({
									value: org.id,
									label: org.name,
								}))}
							/>
						</Group>
					</Stack>
				</ScrollArea>
			) : (
				<CloudSplash />
			)}
		</Box>
	);
}
