import { openModal } from "@mantine/modals";
import posthog from "posthog-js";
import { HelpCenter } from "~/components/HelpCenter";
import { PrimaryTitle } from "~/components/PrimaryTitle";

export async function openHelpAndSupport() {
	posthog.capture("support_open");

	openModal({
		title: <PrimaryTitle fz={24}>How can we help you?</PrimaryTitle>,
		withCloseButton: true,
		size: 900,
		children: <HelpCenter onBody />,
	});
}
