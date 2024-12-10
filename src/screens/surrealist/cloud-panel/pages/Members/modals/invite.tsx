import { Button, Group, Modal, Text } from "@mantine/core";
import { useLayoutEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { EmailInput } from "~/components/Inputs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconPlus } from "~/util/icons";

export interface InviteModalProps {
	opened: boolean;
	onClose: () => void;
}

export function InviteModal({ opened, onClose }: InviteModalProps) {
	const [emails, setEmails] = useState<string[]>([]);

	// const handleSubmit = useStable((e: any) => {
	// 	if (!email) return;

	// 	if (!e.key || e?.key === "Enter") {
	// 		setEmails(v => [...v, email]);
	// 		setEmail("");
	// 	}
	// });

	useLayoutEffect(() => {
		if (opened) {
			setEmails([]);
		}
	}, [opened]);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			trapFocus={false}
			size="md"
			title={<PrimaryTitle>Invite members to organization</PrimaryTitle>}
		>
			<Form onSubmit={onClose}>
				<Text size="lg">
					Invite new members to your organization by entering their
					email addresses below. Press enter to add each email.
				</Text>

				<EmailInput
					autoFocus
					mt="xl"
					value={emails}
					onChange={setEmails}
				/>

				<Group mt="xl">
					<Button
						onClick={onClose}
						color="slate"
						variant="light"
						flex={1}
					>
						Close
					</Button>
					<Button
						type="submit"
						variant="gradient"
						flex={1}
						disabled={emails.length === 0}
						rightSection={<Icon path={iconPlus} />}
					>
						Invite
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
