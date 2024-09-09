import { Anchor, Button, Checkbox, Group, Stack, Text } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useCheckbox } from "~/hooks/events";
import { useStable } from "~/hooks/stable";
import { showError } from "~/util/helpers";
import { iconCheck } from "~/util/icons";
import { fetchAPI } from "../api";
import { invalidateSession } from "../api/auth";
import { type Question, openAboutModal } from "./about-yourself";

const CONTRACTS = [
	{
		name: "Terms and Conditions",
		url: "https://surrealdb.com/legal/cloud-beta-terms",
	},
	{
		name: "Acceptable Use Policy",
		url: "https://surrealdb.com/legal/acceptable-use",
	},
	{
		name: "Privacy Policy",
		url: "https://surrealdb.com/legal/privacy",
	}
];

export function openTermsModal() {
	openModal({
		size: "lg",
		closeOnEscape: false,
		closeOnClickOutside: false,
		title: <PrimaryTitle>Terms and Conditions</PrimaryTitle>,
		children: <TermsModal />,
	});
}

function TermsModal() {
	const [termsChecked, setTermsChecked] = useState(false);
	const [newsChecked, setNewsChecked] = useState(false);
	const [loading, setLoading] = useState(false);

	const updateTermsChecked = useCheckbox(setTermsChecked);
	const updateNewsChecked = useCheckbox(setNewsChecked);

	const declineTerms = useStable(() => {
		closeAllModals();
		invalidateSession();
	});

	const acceptTerms = useStable(async () => {
		setLoading(true);

		try {
			await fetchAPI("/user/terms-accepted", {
				method: "PATCH",
			});

			const questions = await fetchAPI<Question[]>("/user/form");

			closeAllModals();
			openAboutModal(questions);
		} catch (err: any) {
			showError({
				title: "Failed to accept terms",
				subtitle: err.message,
			});
		} finally {
			setLoading(false);
		}
	});

	return (
		<Stack>
			<Text fz="lg">
				Please accept our terms and conditions before getting started
				with Surreal Cloud.
			</Text>
			<Checkbox
				mt="xl"
				checked={termsChecked}
				onChange={updateTermsChecked}
				label={
					<>
						<Text span>I have read and agree to the </Text>
						{CONTRACTS.map((contract, i) => (
							<>
								<Anchor key={i} href={contract.url} inline>
									{contract.name}
								</Anchor>
								{i < CONTRACTS.length - 1 && <Text span>, </Text>}
							</>
						))}
					</>
				}
			/>
			<Checkbox
				checked={newsChecked}
				onChange={updateNewsChecked}
				label="I agree to receive occasional emails about Surreal Cloud updates and features"
			/>
			<Group mt="xl">
				<Button color="slate" variant="light" onClick={declineTerms}>
					Decline
				</Button>
				<Spacer />
				<Button
					variant="gradient"
					disabled={!termsChecked}
					loading={loading}
					rightSection={<Icon path={iconCheck} />}
					onClick={acceptTerms}
				>
					Accept & continue
				</Button>
			</Group>
		</Stack>
	);
}
