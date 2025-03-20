import { openModal } from "@mantine/modals";
import { HelpCenter } from "~/components/HelpCenter";
import { PrimaryTitle } from "~/components/PrimaryTitle";

export async function openHelpAndSupport() {
	window.tagEvent("help_and_support_open");

	openModal({
		title: <PrimaryTitle fz={24}>How can we help you?</PrimaryTitle>,
		withCloseButton: true,
		size: 900,
		children: <HelpCenter onBody />,
		padding: 32,
	});
}
