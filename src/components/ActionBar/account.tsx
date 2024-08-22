import { Avatar, Box, Button, Group, Loader, Menu, Modal, Stack, TextInput, Tooltip, UnstyledButton } from "@mantine/core";
import { Icon } from "../Icon";
import { invalidateSession } from "~/screens/cloud-manage/api/auth";
import { useCloudStore } from "~/stores/cloud";
import { Text } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { mdiAccountOutline, mdiExitToApp } from "@mdi/js";
import { PrimaryTitle } from "../PrimaryTitle";
import { Form } from "../Form";
import { useBoolean } from "~/hooks/boolean";
import { useInputState } from "@mantine/hooks";
import { fetchAPI } from "~/screens/cloud-manage/api";
import { showError } from "~/util/helpers";
import { CloudProfile } from "~/types";
import { useState } from "react";

interface AccountFormProps {
	onClose(): void;
}

function AccountForm({
	onClose
}: AccountFormProps) {
	const { setAccountProfile } = useCloudStore.getState();

	const profile = useCloudStore((s) => s.profile);
	const [isLoading, setLoading] = useState(false);

	const [name, setName] = useInputState(profile.name || "");

	const saveSettings = useStable(async () => {
		try {
			setLoading(true);

			const profile = await fetchAPI<CloudProfile>("/user/profile", {
				method: "PATCH",
				body: JSON.stringify({
					name,
				})
			});

			setAccountProfile(profile);
			onClose();
		} catch(err: any) {
			showError({
				title: "Failed to save account",
				subtitle: err.message
			});
		} finally {
			setLoading(false);
		}
	});

	return (
		<Form onSubmit={saveSettings}>
			<Stack>
				<TextInput
					label="Full name"
					value={name}
					onChange={setName}
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
						disabled={!name || name === profile.name}
					>
						Save changes
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}

export function CloudAccount() {
	const { setActiveView } = useConfigStore.getState();
	const [showSettings, settingsModal] = useBoolean();

	const profile = useCloudStore((s) => s.profile);
	const state = useCloudStore((s) => s.authState);

	const openCloud = useStable(() => {
		setActiveView("cloud");
	});

	if (state === "unauthenticated") {
		return (
			<Tooltip
				label="Sign in to Surreal Cloud"
			>
				<Avatar
					radius="md"
					size={36}
					onClick={openCloud}
					renderRoot={(props) => (
						<UnstyledButton {...props} />
					)}
				/>
			</Tooltip>
		);
	}

	const name = profile.name || "Unknown";

	return (
		<>
			<Menu
				position="bottom-end"
				trigger="click-hover"
				disabled={state === "loading"}
				transitionProps={{
					transition: "scale-y"
				}}
			>
				<Menu.Target>
					<Avatar
						radius="md"
						size={36}
						name={name}
						src={profile.picture}
						component={UnstyledButton}
					>
						{state === "loading" && <Loader size="sm" color="slate.4" />}
					</Avatar>
				</Menu.Target>
				<Menu.Dropdown w={200}>
					<Box p="sm">
						<Text fz="md" fw={500} c="bright">
							{name}
						</Text>
						<Text fz="sm" c="slate" mt={-3}>
							{profile.username}
						</Text>
					</Box>
					<Menu.Divider />
					<Menu.Item
						leftSection={<Icon path={mdiAccountOutline} />}
						onClick={settingsModal.open}
					>
						Account
					</Menu.Item>
					<Menu.Item
						leftSection={<Icon path={mdiExitToApp} />}
						onClick={invalidateSession}
					>
						Sign out
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>

			<Modal
				opened={showSettings}
				onClose={settingsModal.close}
				title={<PrimaryTitle>Account settings</PrimaryTitle>}
			>
				<AccountForm
					onClose={settingsModal.close}
				/>
			</Modal>
		</>
	);
}
