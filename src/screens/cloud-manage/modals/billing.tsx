import {
	Alert,
	Button,
	Group,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useQueryClient } from "@tanstack/react-query";
import { shake } from "radash";
import { useState } from "react";
import { useImmer } from "use-immer";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudBilling, CloudOrganization } from "~/types";
import { iconAccount } from "~/util/icons";
import { ApiError, fetchAPI } from "../api";
import { useCloudBilling } from "../hooks/billing";

export async function openBillingModal() {
	return new Promise<void>((resolve) => {
		openModal({
			modalId: "billing",
			size: "lg",
			onClose: resolve,
			title: (
				<Group>
					<Icon path={iconAccount} size="xl" />
					<PrimaryTitle>Billing Details</PrimaryTitle>
				</Group>
			),
			children: <BillingModal />,
		});
	});
}

function BillingModal() {
	const organization = useOrganization();
	const details = useCloudBilling(organization?.id);

	return details.data && organization ? (
		<BillingForm organization={organization} details={details.data} />
	) : (
		<Text>Loading...</Text>
	);
}

interface BillingFormProps {
	organization: CloudOrganization;
	details: CloudBilling;
}

function BillingForm({ organization, details }: BillingFormProps) {
	const [data, setData] = useImmer(details);
	const [isLoading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	const [error, setError] = useState("");

	const countryList = useCloudStore((state) => state.billingCountries).map(
		(country) => ({
			value: country.code,
			label: country.name,
		}),
	);

	const handleClose = useStable(() => {
		closeModal("billing");
	});

	const handleSubmit = useStable(async () => {
		setLoading(true);

		try {
			await fetchAPI(`/organizations/${organization.id}/billing`, {
				method: "PUT",
				body: JSON.stringify(shake(data, (e) => !e)),
			});

			handleClose();

			queryClient.invalidateQueries({
				queryKey: ["cloud", "billing", organization.id],
			});
		} catch(err: any) {
			if (err instanceof ApiError) {
				const msg = await err.errorMessage();

				setError(msg || "Unknown error occurred while saving details");
			}	
		} finally {
			setLoading(false);
		}
	});

	return (
		<Form onSubmit={handleSubmit}>
			<Stack>
				{error && (
					<Alert
						color="red"
						title="Failed to save billing details"
					>
						{error}
					</Alert>
				)}
				<TextInput
					label="Full Name"
					required
					value={data.Name}
					onChange={(e) =>
						setData((d) => {
							d.Name = e.target.value;
						})
					}
				/>
				<TextInput
					label="Company Name"
					value={data.LegalName}
					onChange={(e) =>
						setData((d) => {
							d.LegalName = e.target.value;
						})
					}
				/>
				<TextInput
					label="Tax Identification Number"
					value={data.TaxIdentificationNumber}
					onChange={(e) =>
						setData((d) => {
							d.TaxIdentificationNumber = e.target.value;
						})
					}
				/>
				<SimpleGrid cols={2}>
					<TextInput
						label="Email"
						required
						value={data.Email}
						onChange={(e) =>
							setData((d) => {
								d.Email = e.target.value;
							})
						}
					/>
					<TextInput
						label="Phone Number"
						required
						value={data.Phone}
						onChange={(e) =>
							setData((d) => {
								d.Phone = e.target.value;
							})
						}
					/>
					<Select
						label="Country"
						required
						searchable
						data={countryList}
						value={data.Country}
						onChange={(v) =>
							setData((d) => {
								d.Country = v as string;
							})
						}
					/>
					<TextInput
						label="State / Region"
						required
						value={data.State}
						onChange={(e) =>
							setData((d) => {
								d.State = e.target.value;
							})
						}
					/>
					<TextInput
						label="Address"
						required
						value={data.AddressLine1}
						onChange={(e) =>
							setData((d) => {
								d.AddressLine1 = e.target.value;
							})
						}
					/>
					<TextInput
						label="Address Line 2"
						value={data.AddressLine2}
						onChange={(e) =>
							setData((d) => {
								d.AddressLine2 = e.target.value;
							})
						}
					/>
					<TextInput
						label="City"
						required
						value={data.City}
						onChange={(e) =>
							setData((d) => {
								d.City = e.target.value;
							})
						}
					/>
					<TextInput
						label="Postal Code"
						required
						value={data.Zipcode}
						onChange={(e) =>
							setData((d) => {
								d.Zipcode = e.target.value;
							})
						}
					/>
				</SimpleGrid>
				<Group mt="xl">
					<Button color="slate" variant="light" onClick={handleClose}>
						Close
					</Button>
					<Spacer />
					<Button
						type="submit"
						variant="gradient"
						loading={isLoading}
					>
						Save details
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
