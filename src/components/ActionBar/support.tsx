import { Title, Tooltip } from "@mantine/core";
import { ActionIcon, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import posthog from "posthog-js";
import { useEffect } from "react";
import { Icon } from "~/components/Icon";
import { useIntent } from "~/hooks/url";
import { iconHelp } from "~/util/icons";
import { HelpCenter } from "../HelpCenter";
import { PrimaryTitle } from "../PrimaryTitle";

export function HelpAndSupport() {
	const [isOpen, openHandle] = useDisclosure();

	useEffect(() => {
		if (isOpen) {
			posthog.capture("support_open");
		}
	}, [isOpen]);

	useIntent("open-help", openHandle.open);

	return (
		<>
			<Tooltip label="Help and support">
				<ActionIcon
					w={36}
					h={36}
					radius="md"
					onClick={openHandle.toggle}
					variant="subtle"
					aria-label="Open Help and support"
				>
					<Icon
						path={iconHelp}
						size="lg"
					/>
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={isOpen}
				onClose={openHandle.close}
				size={900}
				title={<PrimaryTitle>How can we help you?</PrimaryTitle>}
			>
				<HelpCenter onBody />
			</Modal>
		</>
	);
}
