import { EventsOn } from "$/runtime/runtime";
import { Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { actions, store } from "~/store";

export function showOnlineAlert() {
	showNotification({
		color: 'green.6',
		message: (
			<Stack spacing={0}>
				<Text weight={600}>
					Database started
				</Text>
				<Text color="light.5">
					Local database is now online
				</Text>
			</Stack>
		)
	});
}

export function showOfflineAlert() {
	showNotification({
		color: 'red.6',
		message: (
			<Stack spacing={0}>
				<Text weight={600}>
					Database stopped
				</Text>
				<Text color="light.5">
					Local database is now offline
				</Text>
			</Stack>
		)
	});
}

export function initializeListeners() {

	EventsOn('database:start', () => {
		store.dispatch(actions.setIsServing(true));
	});

	EventsOn('database:stop', () => {
		store.dispatch(actions.setIsServing(false));

		showOfflineAlert();
	});

}