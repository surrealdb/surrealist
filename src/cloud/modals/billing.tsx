import { Alert, Button, Group, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useQueryClient } from "@tanstack/react-query";
import { shake } from "radash";
import { useState } from "react";
import { useImmer } from "use-immer";
import { ApiError, fetchAPI, updateCloudInformation } from "~/cloud/api";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudBilling, CloudOrganization } from "~/types";
import { iconAccount } from "~/util/icons";
import { useCloudBillingQuery } from "../queries/billing";

export async function openBillingDetails(organization: CloudOrganization) {
	return new Promise<void>((resolve) => {
		openModal({
			modalId: "billing",
			size: "lg",
			onClose: resolve,
			closeOnClickOutside: false,
			title: (
				<Group>
					<Icon
						path={iconAccount}
						size="xl"
					/>
					<PrimaryTitle>Billing Details</PrimaryTitle>
				</Group>
			),
			children: <BillingDetailsModal organization={organization} />,
		});
	});
}

interface BillingDetailsModalProps {
	organization: CloudOrganization;
}

function BillingDetailsModal({ organization }: BillingDetailsModalProps) {
	const details = useCloudBillingQuery(organization?.id);

	return details.data && organization ? (
		<BillingForm
			organization={organization}
			details={details.data}
		/>
	) : (
		<Text>Loading...</Text>
	);
}

interface BillingFormProps {
	organization: CloudOrganization;
	details: CloudBilling;
}

function BillingForm({ organization, details }: BillingFormProps) {
	const [data, setData] = useImmer({
		Name: details.Name || "",
		Email: details.Email || "",
		AddressLine1: details.AddressLine1 || "",
		AddressLine2: details.AddressLine2 || "",
		City: details.City || "",
		Zipcode: details.Zipcode || "",
		State: details.State || "",
		Country: details.Country || "",
		LegalName: details.LegalName || "",
		TaxIdentificationNumber: details.TaxIdentificationNumber || "",
		Phone: details.Phone || "",
	});
	const [isLoading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	const [error, setError] = useState("");

	const countryList = useCloudStore((state) => state.billingCountries).map((country) => ({
		value: country.code,
		label: country.name,
	}));

	const handleClose = useStable(() => {
		closeModal("billing");
	});

	const [invalidState, setInvalidState] = useState<string | boolean>(true);

	const validateState = useStable(() => {
		if (
			!data.Name ||
			!data.Email ||
			!data.Phone ||
			!data.Country ||
			!data.State ||
			!data.AddressLine1 ||
			!data.City ||
			!data.Zipcode
		) {
			return true;
		}

		if (data.Email.length < 7 || data.Email.length > 100) {
			return "Email must be between 7 and 100 characters";
		}

		if (data.Zipcode.length < 4 || data.Zipcode.length > 10) {
			return "Postal code must be between 4 and 10 characters";
		}

		if (
			data.TaxIdentificationNumber &&
			(data.TaxIdentificationNumber.length < 9 || data.TaxIdentificationNumber.length > 20)
		) {
			return "Tax Identification Number must be between 9 and 20 characters";
		}

		if (data.Phone.length < 7 || data.Phone.length > 20) {
			return "Phone number must be between 7 and 20 characters";
		}

		return false;
	});

	const updateValidation = useStable(() => {
		setInvalidState(validateState());
	});

	const handleSubmit = useStable(async () => {
		setInvalidState(false);
		setLoading(true);

		try {
			await fetchAPI(`/organizations/${organization.id}/billing`, {
				method: "PUT",
				body: JSON.stringify(shake(data, (e) => !e)),
			});

			handleClose();
			updateCloudInformation();

			queryClient.invalidateQueries({
				queryKey: ["cloud", "billing", organization.id],
			});

			queryClient.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});
		} catch (err: any) {
			if (err instanceof ApiError) {
				setError(err.reason);
			}
		} finally {
			setLoading(false);
		}
	});

	return (
		<Form onSubmit={handleSubmit}>
			<Stack>
				{typeof invalidState === "string" ? (
					<Alert
						color="red"
						title="Invalid details"
					>
						{invalidState}
					</Alert>
				) : (
					error && (
						<Alert
							color="red"
							title="Failed to save billing details"
						>
							{error}
						</Alert>
					)
				)}
				<TextInput
					label="Full Name"
					required
					value={data.Name}
					onBlur={updateValidation}
					onChange={(e) =>
						setData((d) => {
							d.Name = e.target.value;
						})
					}
				/>
				<TextInput
					label="Company Name"
					value={data.LegalName}
					onBlur={updateValidation}
					onChange={(e) =>
						setData((d) => {
							d.LegalName = e.target.value;
						})
					}
				/>
				<TextInput
					label="Tax Identification Number"
					value={data.TaxIdentificationNumber}
					onBlur={updateValidation}
					onChange={(e) =>
						setData((d) => {
							d.TaxIdentificationNumber = e.target.value;
						})
					}
				/>
				<SimpleGrid
					cols={{
						xs: 1,
						sm: 2,
					}}
				>
					<TextInput
						label="Email"
						required
						value={data.Email}
						onBlur={updateValidation}
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
						onBlur={updateValidation}
						onChange={(e) =>
							setData((d) => {
								d.Phone = e.target.value;
							})
						}
					/>{" "}
					<Select
						label="Country"
						required
						searchable
						data={countryList}
						value={data.Country || ""}
						onBlur={updateValidation}
						data-1p-ignore
						onChange={(v) =>
							setData((d) => {
								d.Country = v || "";
							})
						}
					/>
					<TextInput
						label="State / Region"
						required
						value={data.State}
						onBlur={updateValidation}
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
						onBlur={updateValidation}
						onChange={(e) =>
							setData((d) => {
								d.AddressLine1 = e.target.value;
							})
						}
					/>
					<TextInput
						label="Address Line 2"
						value={data.AddressLine2}
						onBlur={updateValidation}
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
						onBlur={updateValidation}
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
						onBlur={updateValidation}
						onChange={(e) =>
							setData((d) => {
								d.Zipcode = e.target.value;
							})
						}
					/>
				</SimpleGrid>
				<Group mt="xl">
					<Button
						color="slate"
						variant="light"
						onClick={handleClose}
					>
						Close
					</Button>
					<Spacer />
					<Button
						type="submit"
						variant="gradient"
						disabled={!!invalidState}
						loading={isLoading}
					>
						Save details
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
