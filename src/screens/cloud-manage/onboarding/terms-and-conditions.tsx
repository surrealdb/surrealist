import { Anchor, Button, Checkbox, Group, Stack, Text } from "@mantine/core";
import { openModal, closeAllModals } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { invalidateSession } from "../api/auth";
import { Spacer } from "~/components/Spacer";
import { useState } from "react";
import { openAboutModal, Question } from "./about-yourself";
import { iconCheck } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { useCheckbox } from "~/hooks/events";
import { useStable } from "~/hooks/stable";
import { fetchAPI } from "../api";
import { showError } from "~/util/helpers";

export function openTermsModal() {
	openModal({
		size: "lg",
		closeOnEscape: false,
		closeOnClickOutside: false,
		title: (
			<PrimaryTitle>Terms and Conditions</PrimaryTitle>
		),
		children: (
			<TermsModal />
		)
	});
}

function TermsModal() {
	const [checked, setChecked] = useState(false);
	const [loading, setLoading] = useState(false);

	const updateChecked = useCheckbox(setChecked);

	const declineTerms = useStable(() => {
		closeAllModals();
		invalidateSession();
	});

	const acceptTerms = useStable(async () => {
		setLoading(true);

		try {
			await fetchAPI("/user/terms-accepted", {
				method: "PATCH"
			});

			const questions = await fetchAPI<Question[]>("/user/form");

			closeAllModals();
			openAboutModal(questions);
		} catch(err: any) {
			showError({
				title: "Failed to accept terms",
				subtitle: err.message
			});
		} finally {
			setLoading(false);
		}
	});

	return (
		<Stack>
			<Text fz="lg">
				Please accept our terms and conditions before getting started with Surreal Cloud.
			</Text>
			<Checkbox
				my="xl"
				checked={checked}
				onChange={updateChecked}
				label={
					<>
						I have read and agree to the <Anchor href="https://surrealdb.com/legal/cloud-beta-terms" target="_blank">Terms and Conditions</Anchor>, <Anchor href="https://surrealdb.com/legal/acceptable-use" target="_blank">Acceptable Use Policy</Anchor>, and <Anchor href="https://surrealdb.com/legal/privacy">Privacy Policy</Anchor>
					</>
				}
			/>
			<Group>
				<Button
					color="slate"
					variant="light"
					onClick={declineTerms}
				>
					Decline
				</Button>
				<Spacer />
				<Button
					variant="gradient"
					disabled={!checked}
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