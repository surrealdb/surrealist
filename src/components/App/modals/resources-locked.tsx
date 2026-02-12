import { Button, Group, Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconAuth } from "@surrealdb/ui";
import { Spacer } from "~/components/Spacer";
import { CloudOrganization } from "~/types";
import { dispatchIntent } from "~/util/intents";

export function openResourcesLockedModal(organisation: CloudOrganization) {
	return openModal({
		modalId: "resources-locked",
		title: (
			<Group>
				<Icon
					size="lg"
					path={iconAuth}
				/>
				<Text
					fw={700}
					fz="xl"
					c="bright"
				>
					Resources locked
				</Text>
			</Group>
		),
		children: (
			<Stack gap="lg">
				<Text>
					Resource configurations within Surrealist are restricted for this organisation.
					In order to make modifications to your resources, please contact support.
				</Text>
				<Group>
					<Button
						color="obsidian"
						variant="light"
						onClick={() => {
							closeModal("resources-locked");
						}}
					>
						Close
					</Button>
					<Spacer />
					<Button
						variant="gradient"
						onClick={() => {
							closeModal("resources-locked");
							dispatchIntent("create-message", {
								type: "conversation",
								conversationType: "general",
								subject: "Resource configuration locked",
								message: `Hello! I am trying to modify the resource configuration for my organisation (ID: ${organisation.id}). However, I am unable to do so as it is locked. Could you please help me?`,
							});
						}}
					>
						Contact support
					</Button>
				</Group>
			</Stack>
		),
	});
}
