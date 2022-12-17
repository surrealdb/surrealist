import { EventsOn } from "$/runtime/runtime";
import { Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { actions, store } from "~/store";

const WAIT_DURATION = 1000;

let startTask: any;

export function initializeListeners() {

	EventsOn('database:start', () => {
		startTask = setTimeout(() => {
			store.dispatch(actions.confirmServing());

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
		}, WAIT_DURATION);
	});

	EventsOn('database:stop', () => {
		if (startTask) {
			clearTimeout(startTask);
		}
		
		store.dispatch(actions.stopServing());

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
	});

	EventsOn('database:error', (msg) => {
		store.dispatch(actions.stopServing());

		showNotification({
			color: 'red.6',
			message: (
				<Stack spacing={0}>
					<Text weight={600}>
						Failed to start database
					</Text>
					<Text color="light.5">
						{msg}
					</Text>
				</Stack>
			)
		});
	});

}