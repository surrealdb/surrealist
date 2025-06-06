import {
	Avatar,
	Box,
	Button,
	Group,
	Loader,
	Menu,
	Modal,
	Stack,
	TextInput,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useState } from "react";
import { fetchAPI } from "~/cloud/api";
import { destroySession, openCloudAuthentication } from "~/cloud/api/auth";
import { useBoolean } from "~/hooks/boolean";
import { useCloudProfile } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudProfile } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { iconAccount, iconChevronRight, iconExitToAp } from "~/util/icons";
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
					<Avatar
						radius="md"
						size={36}
						name={name}
						src={profile.picture}
						component={UnstyledButton}
					>
						{state === "loading" && !profile.picture && (
							<Loader
								size="sm"
								color="slate.4"
							/>
						)}
					</Avatar>
				</Menu.Target>
				<Menu.Dropdown w={200}>
					<Box
						p="sm"
						style={{ userSelect: "text", WebkitUserSelect: "text" }}
					>
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
					<Menu.Divider />
					<Menu.Item
						leftSection={<Icon path={iconAccount} />}
						onClick={settingsModal.open}
					>
						Account
					</Menu.Item>
					<Menu.Item
						leftSection={<Icon path={iconExitToAp} />}
						onClick={destroySession}
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
				<AccountForm onClose={settingsModal.close} />
			</Modal>
		</>
	);
}
