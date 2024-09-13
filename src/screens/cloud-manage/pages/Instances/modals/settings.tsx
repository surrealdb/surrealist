import { Alert, Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { fetchAPI } from "~/screens/cloud-manage/api";
import type { CloudInstance } from "~/types";
import { showError } from "~/util/helpers";
import { iconWarning } from "~/util/icons";

export interface SettingsModalProps {
	opened: boolean;
	onClose: () => void;
	onRefetch: () => void;
	instance: CloudInstance;
}

export function SettingsModal({ opened, onClose, onRefetch, instance }: SettingsModalProps) {
	const [name, setName] = useInputState("");
	const [type, setType] = useInputState("");
	const [isLoading, setLoading] = useState(false);

	const instanceTypes = useAvailableInstanceTypes().filter((t) => t.enabled !== false);
	const types = instanceTypes.map((t) => t.slug);

	const saveSettings = useStable(async () => {
		setLoading(true);

		try {
			await fetchAPI(`/instances/${instance.id}/type`, {
				method: "PATCH",
				body: JSON.stringify({
					slug: type,
				}),
			});

			onClose();
			onRefetch();
		} catch (err: any) {
			showError({
				title: "Failed to save instance",
				subtitle: `Settings could not be saved: ${err.message}`,
			});
		} finally {
			setLoading(false);
		}
	});

	useLayoutEffect(() => {
		setName(instance.name);
		setType(instance.type.slug);
	}, [instance]);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			trapFocus={false}
			withCloseButton
			title={<PrimaryTitle>Instance settings</PrimaryTitle>}
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
							<Text>Instance name cannot be changed at this time</Text>
						</Group>
					</Alert>

					<TextInput
						label="Instance name"
						value={name}
						onChange={setName}
						disabled
					/>
					<Select
						data={types}
						label="Instance preset"
						value={type}
						onChange={setType}
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
							loading={isLoading}
						>
							Save changes
						</Button>
					</Group>
				</Stack>
			</Form>
		</Modal>
	);
}
