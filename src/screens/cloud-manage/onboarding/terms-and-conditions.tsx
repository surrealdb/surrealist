import { Button, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { openModal, closeAllModals } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { invalidateSession } from "../auth";
import { Spacer } from "~/components/Spacer";
import dedent from "dedent";
import { useState } from "react";
import { openAboutModal } from "./about-yourself";
import { iconCheck } from "~/util/icons";
import { Icon } from "~/components/Icon";

const TERMS = dedent`
  Terms and Conditions for Surreal Cloud

  Last Updated: A Date Suspiciously in the Future

  1. Acceptance of Terms
  By using Surreal Cloud, you agree to all the terms and conditions stated below, even if you didn’t actually read them (we know you didn’t). This agreement is binding, just like your weekly subscription to that magazine you forgot to cancel.

  2. Service Description
  Surreal Cloud provides an ephemeral, vaguely defined cloud service that may or may not include storage, computing, weather control, and free virtual donuts. However, we make no promises about what our service actually does. Any resemblance to real cloud services, living or dead, is purely coincidental.

  3. User Responsibilities
  You are responsible for remembering your password, feeding your virtual plants, and not using Surreal Cloud for any illegal activities, including but not limited to: time travel, interdimensional communication, or summoning ancient beings. If you forget your password, we might send you on a quest to recover it.

  4. Data Storage and Security
  Your data is stored in a top-secret location guarded by a sleepy cat. While we take security very seriously, we cannot guarantee that your data won’t be lost, misplaced, or accidentally sent to an alternate reality.

  5. Payment Terms
  Surreal Cloud offers a range of pricing plans, from the “Free as a Bird” plan to the “Gold-Plated Unicorn” premium plan. Payment can be made in various currencies, including but not limited to: dollars, Euros, gold doubloons, and unripe avocados. All sales are final, and refunds are processed through a highly complex series of rituals.

  6. Limitation of Liability
  In no event shall Surreal Cloud be liable for anything that goes wrong, including but not limited to: data loss, service outages, unexpected black holes, or sentient AI taking over your account. Basically, if anything bad happens, it’s not our fault.

  7. Indemnification
  You agree to defend, indemnify, and hold harmless Surreal Cloud from any claims, lawsuits, or angry letters you might receive as a result of using our service. This includes any issues arising from spontaneous unicorn appearances, which we take no responsibility for.

  8. Modifications to the Service
  Surreal Cloud reserves the right to modify, suspend, or discontinue the service at any time, possibly without even telling you. We might change the color scheme, add a “Summon Thunderstorm” button, or just decide to take a nap.

  9. Governing Law
  These terms are governed by the laws of the Kingdom of Narnia. Any disputes will be settled by trial by combat, or by a game of rock-paper-scissors, at our discretion.

  10. Contact Information
  If you have any questions about these terms, you can contact us by sending a carrier pigeon or by shouting loudly into the void. Responses are not guaranteed.
`;

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
	const [hasRead, setHasRead] = useState(false);

	return (
		<Stack>
			<Text fz="lg">
				Please read and accept the following terms and conditions before getting started with the Surreal Cloud.
			</Text>
			<Paper withBorder p="md">
				<ScrollArea
					h={600}
					onBottomReached={() => setHasRead(true)}
					type="always"
				>
					<Text
						c="bright"
						style={{
							whiteSpace: "pre-wrap",
							overflowWrap: "break-word"
						}}
					>
						{TERMS}
					</Text>
				</ScrollArea>
			</Paper>
			<Group>
				<Button
					color="slate"
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
					disabled={!hasRead}
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