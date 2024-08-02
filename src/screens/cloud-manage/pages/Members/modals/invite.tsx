import { ActionIcon, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { mdiEmail } from "@mdi/js";
import { useLayoutEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus, iconSearch } from "~/util/icons";

export interface InviteModalProps {
	opened: boolean;
	onClose: () => void;
}

export function InviteModal({
	opened,
	onClose,
}: InviteModalProps) {
	const [emails, setEmails] = useState<string[]>([]);
	const [email, setEmail] = useInputState("");

	const handleSubmit = useStable((e: any) => {
		if (!email) return;

		if (!e.key || e?.key === "Enter") {
			setEmails(v => [...v, email]);
			setEmail("");
		}
	});

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
			<Text size="lg">
				Invite new members to your organization by entering their email addresses below.
			</Text>

			<TextInput
				placeholder="Enter email..."
				leftSection={<Icon path={iconSearch} />}
				autoFocus
				mt="xl"
				value={email}
				onChange={setEmail}
				onKeyDown={handleSubmit}
				rightSection={
					<ActionIcon
						onClick={handleSubmit}
						variant="transparent"
						color="blue"
						disabled={!email}
					>
						<Icon path={iconPlus} />
					</ActionIcon>
				}
			/>

			{emails.length > 0 && (
				<Stack mt="xl" gap="sm">
					{emails.map((email, index) => (
						<Group key={index}>
							<Icon
								path={mdiEmail}
								c="slate"
							/>
							<Text
								flex={1}
								c="bright"
							>
								{email}
							</Text>
							<ActionIcon
								onClick={() => setEmails(v => v.filter((_, i) => i !== index))}
								color="red"
								size="sm"
							>
								<Icon path={iconClose} size="sm" />
							</ActionIcon>
						</Group>
					))}
				</Stack>
			)}

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
		</Modal>
	);
}