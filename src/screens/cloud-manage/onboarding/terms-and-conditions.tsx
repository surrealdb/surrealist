import { Button, Checkbox, Group, Stack, Text } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useCheckbox } from "~/hooks/events";
import { useStable } from "~/hooks/stable";
import { showError } from "~/util/helpers";
import { iconCheck } from "~/util/icons";
import { fetchAPI } from "../api";
import { invalidateSession } from "../api/auth";
import { type Question, openAboutModal } from "./about-yourself";

interface Condition {
	name: string;
	url: string;
}

export async function openTermsModal() {
	const conditions = await fetchAPI<Condition[]>("/tc-pp");

	openModal({
		size: "lg",
		closeOnEscape: false,
		closeOnClickOutside: false,
		title: <PrimaryTitle>Terms and Conditions</PrimaryTitle>,
		children: <TermsModal conditions={conditions} />,
	});
}

interface TermsModalProps {
	conditions: Condition[];
}

function TermsModal({ conditions }: TermsModalProps) {
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
				body: JSON.stringify({
					use: termsChecked,
					marketing: newsChecked,
				}),
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
				Please accept our terms and conditions before getting started with Surreal Cloud.
			</Text>
			<Checkbox
				mt="xl"
				checked={termsChecked}
				onChange={updateTermsChecked}
				label={
					<>
						<Text span>I have read and agree to the </Text>
						{conditions.map((condition, i) => (
							<>
								<Link
									key={i}
									href={condition.url}
									inline
								>
									{condition.name}
								</Link>
								{i < conditions.length - 1 && <Text span>, </Text>}
							</>
						))}
						.
					</>
				}
			/>
			<Checkbox
				checked={newsChecked}
				onChange={updateNewsChecked}
				label="By subscribing to SurrealDB, you will receive carefully curated content, information on new products and features plus details of educational events where you can engage with our team and community."
			/>
			<Group mt="xl">
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
