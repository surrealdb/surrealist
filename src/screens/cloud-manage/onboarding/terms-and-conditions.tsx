import { Anchor, Button, Checkbox, Group, Stack, Text } from "@mantine/core";
import { openModal, closeAllModals } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { invalidateSession } from "../api/auth";
import { Spacer } from "~/components/Spacer";
import { useState } from "react";
import { openAboutModal } from "./about-yourself";
import { iconCheck } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { useCheckbox } from "~/hooks/events";

export function openTermsModal() {
	openModal({
		size: "lg",
		title: (
			<PrimaryTitle>Terms and Conditions</PrimaryTitle>
		),
		children: (
			<TermsModal />
		)
	});
}

function TermsModal() {
	const isLight = useIsLight();
	const [checked, setChecked] = useState(false);

	const updateChecked = useCheckbox(setChecked);

	return (
		<Stack>
			<Text fz="lg">
				Please accept our terms and conditions before getting started with the Surreal Cloud.
			</Text>
			<Checkbox
				my="xl"
				checked={checked}
				onChange={updateChecked}
				label={
					<Group gap="xs">
						I agree to the <Anchor href="https://surrealdb.com/terms" target="_blank">Terms and Conditions</Anchor>
					</Group>
				}
			/>
			<Group>
				<Button
					color="slate"
					variant="light"
					onClick={() => {
						closeAllModals();
						invalidateSession();
					}}
				>
					Decline
				</Button>
				<Spacer />
				<Button
					variant="gradient"
					disabled={!checked}
					rightSection={<Icon path={iconCheck} />}
					onClick={() => {
						closeAllModals();
						openAboutModal();
					}}
				>
					Accept & continue
				</Button>
			</Group>
		</Stack>
	);
}