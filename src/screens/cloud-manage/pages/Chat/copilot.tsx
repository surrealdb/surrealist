import { useInterval } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { fastParseJwt, newId, showError } from "~/util/helpers";

const WORKFLOW_ID = import.meta.env.VITE_SCOUT_WORKFLOW_ID;
const COPILOT_ID = import.meta.env.VITE_SCOUT_COPILOT_ID;
const BASE_URL = "https://api-prod.scoutos.com";

export function useCopilotMutation() {
	const { pushChatMessage, updateChatMessage, completeChatResponse } = useCloudStore.getState();

	const [isResponding, setIsResponding] = useState(false);
	const token = useCopilotToken();

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
		Origin: window.location.origin,
	};

	const controller = useRef<AbortController>();

	useEffect(() => {
		return () => {
			controller.current?.abort();
		};
	}, []);

	const sendMessage = useStable(async (message: string) => {
		setIsResponding(true);

		try {
			const { chatConversation } = useCloudStore.getState();
			const history = chatConversation.slice(-3).map((msg) => ({
				content: msg.content,
				role: msg.sender,
			}));

			controller.current = new AbortController();

			const res = await fetch(
				`${BASE_URL}/v2/copilot/${WORKFLOW_ID}/cook?copilot_id=${COPILOT_ID}`,
				{
					signal: controller.current?.signal,
					method: "POST",
					headers,
					body: JSON.stringify({
						streaming: true,
						inputs: {
							user_message: message,
							chat_history: history,
						},
					}),
				},
			);

			if (!res.ok || !res.body) {
				throw new Error(`Request failed with status: ${res.status}`);
			}

			const msgId = newId();
			const reader = res.body.getReader();

			pushChatMessage({
				id: msgId,
				content: "",
				sender: "assistant",
				loading: true,
			});

			await readResponseStream(reader, (event, value) => {
				console.debug(`Copilot message (${event}):`, value);

				switch (event) {
					// Listen for workflow failures
					case "workflow_run_failed": {
						console.error("Workflow run failed:", value);

						updateChatMessage(msgId, (msg) => {
							msg.content = "I'm sorry, I encountered an error";
							msg.loading = false;
						});

						showError({
							title: "Chat error",
							subtitle: "Sidekick encountered an unexpected error",
						});
						break;
					}

					// Listen for workflow completion
					case "workflow_run_completed": {
						completeChatResponse(msgId);
						break;
					}

					// Listen for message updates
					case "block_state_updated": {
						const { block_id, update_type, update_data } = value.data;

						if (block_id !== "copilot_message_i9qyel") {
							break;
						}

						updateChatMessage(msgId, (msg) => {
							msg.loading = false;

							if (update_type === "partial") {
								msg.content = msg.content + update_data.output;
							} else if (update_type === "complete") {
								msg.content = update_data.output;
							}
						});

						break;
					}
				}
			});
		} finally {
			setIsResponding(false);
		}
	});

	return { sendMessage, isResponding };
}

export function useCopilotToken() {
	const [token, setToken] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const refreshToken = useStable(async () => {
		if (isTokenValid(token) || refreshing) {
			return;
		}

		setRefreshing(true);

		try {
			const response = await fetch(`${BASE_URL}/v1/copilot/get-ingredient`, {
				method: "GET",
				headers: {
					Origin: window.location.origin,
				},
			});

			if (!response.ok) {
				throw new Error(`Token fetch failed with status: ${response.status}`);
			}

			const data = await response.json();

			setToken(data.token);
			adapter.log("Copilot", "Acquired new token");
		} catch (error) {
			console.error("Error fetching token:", error);
			throw error;
		} finally {
			setRefreshing(false);
		}
	});

	useInterval(refreshToken, 1000 * 60 * 4, {
		autoInvoke: true,
	});

	refreshToken();

	return token;
}

/**
 * Verify token validity
 */
function isTokenValid(token: string) {
	if (!token) {
		return false;
	}

	try {
		const payload = fastParseJwt(token);
		const currentTime = Date.now() / 1000;

		return currentTime < payload.exp;
	} catch (error) {
		console.error("Invalid token format:", error);
		return false;
	}
}

/**
 * Read a response stream from a fetch request
 */
async function readResponseStream(
	reader: ReadableStreamDefaultReader,
	onMessage: (event: string, value: any) => void,
) {
	let buffer = "";
	let event = "";

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		const chunk = new TextDecoder().decode(value);

		for (const char of chunk) {
			buffer += char;

			if (char === "\n") {
				const payload = buffer.trim();
				buffer = "";

				if (payload) {
					const index = payload.indexOf(":");
					const type = payload.slice(0, index);
					const value = payload.slice(index + 2);

					if (type === "event") {
						event = value;
					} else if (type === "data") {
						onMessage(event, JSON.parse(value));
					}
				}
			}
		}
	}
}
