import { Button, Divider, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconChevronRight, iconEmail } from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";

const MODAL_ID = "verify-email";

export interface VerifyEmailModalProps {
	onRetry: () => void;
}

function VerifyEmailModal({ onRetry }: VerifyEmailModalProps) {
	return (
		<Stack>
			<Text>
				Please verify your email before continuing. If you have not received an email,
				please check your spam folder.
			</Text>
			<Divider my="sm" />
			<Text>Already verified your email?</Text>
			<Button
				mt="md"
				variant="gradient"
				rightSection={<Icon path={iconChevronRight} />}
				onClick={() => {
					closeModal(MODAL_ID);
					onRetry();
				}}
			>
				Continue
			</Button>
		</Stack>
	);
}

export function openVerifyEmailModal(onRetry: () => void) {
	openModal({
		modalId: MODAL_ID,
		size: "md",
		title: (
			<Group>
				<ThemeIcon variant="surreal">
					<Icon
						path={iconEmail}
						size="sm"
					/>
				</ThemeIcon>
				<PrimaryTitle>Verify your email</PrimaryTitle>
			</Group>
		),
		children: <VerifyEmailModal onRetry={onRetry} />,
	});
}
