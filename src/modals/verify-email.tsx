import { Button, Group, List, Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconEmail } from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";

const MODAL_ID = "verify-email";

export interface VerifyEmailModalProps {
	onRetry: () => void;
}

function VerifyEmailModal({ onRetry }: VerifyEmailModalProps) {
	return (
		<Stack>
			<Text>
				Please verify your email before continuing to SurrealDB Cloud. If you have not
				received an email, please check your spam folder.
			</Text>
			<List>
				<List.Item>Open your email inbox and find the email</List.Item>
				<List.Item>Press the button to verify your email</List.Item>
				<List.Item>Return to Surrealist to enter SurrealDB Cloud</List.Item>
			</List>
			<Text mt="md">Already verified your email?</Text>
			<Button
				variant="gradient"
				radius="xs"
				onClick={() => {
					closeModal(MODAL_ID);
					onRetry();
				}}
			>
				Continue to SurrealDB Cloud
			</Button>
		</Stack>
	);
}

export function openVerifyEmailModal(onRetry: () => void) {
	openModal({
		modalId: MODAL_ID,
		title: (
			<Group>
				<Icon
					path={iconEmail}
					size="xl"
				/>
				<PrimaryTitle>Verify your email</PrimaryTitle>
			</Group>
		),
		children: <VerifyEmailModal onRetry={onRetry} />,
	});
}
