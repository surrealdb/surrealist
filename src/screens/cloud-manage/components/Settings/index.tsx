import { Modal, Stack, TextInput, Group, Button, Alert, Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { iconWarning } from "~/util/icons";

export interface CloudSettingsProps {
	opened: boolean;
	onClose(): void;
}

export function CloudSettings({
	opened,
	onClose,
}: CloudSettingsProps) {
	const organization = useOrganization();

	const [name, setName] = useInputState(organization?.name ?? "");

	const saveSettings = useStable(async () => {
		onClose();
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<PrimaryTitle>Organization settings</PrimaryTitle>}
		>
			<Form onSubmit={saveSettings}>
				<Stack>
					<Alert
						color="pink.9"
						variant="filled"
						mb="sm"
					>
						<Group>
							<Icon path={iconWarning} />
							<Text>
								Organization settings can not be changed during the alpha
							</Text>
						</Group>
					</Alert>
					<TextInput
						label="Organization name"
						value={name}
						onChange={setName}
						disabled
					/>
					<Group mt="lg">
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
							disabled
						>
							Save changes
						</Button>
					</Group>
				</Stack>
			</Form>
		</Modal>
	);
}