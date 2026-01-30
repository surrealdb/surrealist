import { Box, Button, Group, Menu, Modal, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useState } from "react";
import { fetchAPI } from "~/cloud/api";
import { destroySession, openCloudAuthentication } from "~/cloud/api/auth";
import { useBoolean } from "~/hooks/boolean";
import { useCloudProfile } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudProfile } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { iconChevronRight, iconCog, iconExitToAp, iconOrganization } from "~/util/icons";
import { AccountAvatar } from "../AccountAvatar";
import { Form } from "../Form";
import { Icon } from "../Icon";
import { PrimaryTitle } from "../PrimaryTitle";

interface AccountFormProps {
	onClose(): void;
}

function AccountForm({ onClose }: AccountFormProps) {
	const { setAccountProfile } = useCloudStore.getState();

	const profile = useCloudProfile();
	const provider = useCloudStore((s) => s.authProvider);
	const [isLoading, setLoading] = useState(false);

	const [name, setName] = useInputState(profile.name || "");

	const saveSettings = useStable(async () => {
		try {
			setLoading(true);

			const profile = await fetchAPI<CloudProfile>("/user/profile", {
				method: "PATCH",
				body: JSON.stringify({
					name,
				}),
			});

			setAccountProfile(profile);
			onClose();
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to save account",
				content: err.message,
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
				<TextInput
					label="Authentication provider"
					readOnly
					disabled
					value={provider || "Unknown"}
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
	const [showSettings, settingsModal] = useBoolean();

	const profile = useCloudProfile();
	const state = useCloudStore((s) => s.authState);
	const [, navigate] = useAbsoluteLocation();

	if (state === "unauthenticated" || state === "unknown") {
		return (
			<Button
				variant="gradient"
				size="xs"
				disabled={state === "unknown"}
				onClick={openCloudAuthentication}
				rightSection={<Icon path={iconChevronRight} />}
			>
				Sign in
			</Button>
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
					transition: "scale-y",
				}}
			>
				<Menu.Target>
					<div>
						<AccountAvatar />
					</div>
				</Menu.Target>
				<Menu.Dropdown miw={200}>
					<Paper
						p="sm"
						mb="xs"
						bg="slate.8"
						radius="xs"
						style={{ userSelect: "text", WebkitUserSelect: "text" }}
					>
						<Group>
							<AccountAvatar />
							<Box>
								<Text
									fz="md"
									fw={500}
									c="bright"
								>
									{name}
								</Text>
								<Text
									fz="sm"
									c="slate"
									mt={-3}
								>
									{profile.username}
								</Text>
							</Box>
						</Group>
					</Paper>
					{/* <Stack gap="xs"> */}
					<Menu.Item
						leftSection={<Icon path={iconCog} />}
						onClick={settingsModal.open}
					>
						Account settings
					</Menu.Item>
					<Menu.Item
						leftSection={<Icon path={iconOrganization} />}
						onClick={() => {
							navigate("/organisations");
						}}
					>
						Organisations
					</Menu.Item>
					<Menu.Divider />
					<Menu.Item
						leftSection={<Icon path={iconExitToAp} />}
						onClick={destroySession}
					>
						Sign out
					</Menu.Item>
					{/* </Stack> */}
				</Menu.Dropdown>
			</Menu>

			<Modal
				opened={showSettings}
				onClose={settingsModal.close}
				title={<PrimaryTitle>Account settings</PrimaryTitle>}
			>
				<AccountForm onClose={settingsModal.close} />
			</Modal>
		</>
	);
}
