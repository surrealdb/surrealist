import { openModal } from "@mantine/modals";
import { HelpCenter } from "~/components/HelpCenter";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { captureMetric } from "~/util/metrics";

export async function openHelpAndSupport() {
	captureMetric("support_open");

	openModal({
		title: <PrimaryTitle fz={24}>How can we help you?</PrimaryTitle>,
		withCloseButton: true,
		size: 900,
		children: <HelpCenter onBody />,
		padding: 32,
	});
}
