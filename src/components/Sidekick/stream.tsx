import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { StreamEvent } from "./types";

const SIDEKICK_ENDPOINT = "https://xzg2igifvha4rfi2w677skt7h40yrtsm.lambda-url.us-east-1.on.aws/";

export type StreamHandler = (message: StreamEvent) => void;

export function useSidekickStream(handler: StreamHandler) {
	const [isResponding, setIsResponding] = useState(false);
	const [currentResponse, setCurrentResponse] = useState("");

	const sendMessage = useStable(async (message: string) => {
		if (isResponding) {
			throw new Error("Sidekick is already responding");
		}

		const { accessToken } = useCloudStore.getState();

		setIsResponding(true);
		setCurrentResponse("");

		// Optimistically update the chat
		// onUpdate((draft) => {
		// 	draft.messages.push({
		// 		role: "user",
		// 		content: message,
		// 	});
		// });

		try {
			const response = await fetch(SIDEKICK_ENDPOINT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					message,
					// conversationId: currentChat.id?.id,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();

			if (!reader) {
				throw new Error("No response body");
			}

			const decoder = new TextDecoder();

			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });

				for (const char of chunk) {
					buffer += char;

					if (char === "\n") {
						const payload = buffer.trim();
						buffer = "";

						if (payload) {
							handler(JSON.parse(payload) as StreamEvent);
						}
					}
				}
			}
		} catch (error) {
			console.error("Failed to send message:", error);
		} finally {
			setIsResponding(false);
			setCurrentResponse("");
		}
	});

	return { sendMessage, isResponding, currentResponse };
}
