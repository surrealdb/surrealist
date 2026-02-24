import { useRef, useState } from "react";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { tagEvent } from "~/util/analytics";
import { StreamEvent } from "./types";

const SIDEKICK_ENDPOINT = "https://xzg2igifvha4rfi2w677skt7h40yrtsm.lambda-url.us-east-1.on.aws/";

export type StreamHandler = (message: StreamEvent) => void;

export interface SidekickStream {
	isResponding: boolean;
	sendMessage: (message: string, chatId?: string) => Promise<void>;
	cancel: () => void;
}

export function useSidekickStream(handler: StreamHandler): SidekickStream {
	const [isResponding, setIsResponding] = useState(false);
	const controller = useRef<AbortController | null>(null);
	const accessToken = useCloudStore((state) => state.accessToken);

	const sendMessage = useStable(async (message: string, chatId?: string) => {
		if (isResponding) {
			throw new Error("Sidekick is already responding");
		}

		setIsResponding(true);

		tagEvent("sidekick_message_sent", {
			chat_id: chatId,
		});

		try {
			controller.current = new AbortController();

			const response = await fetch(SIDEKICK_ENDPOINT, {
				method: "POST",
				signal: controller.current.signal,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					message,
					chatId,
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
		}
	});

	const cancel = useStable(() => {
		controller.current?.abort("Chat was cancelled");
	});

	return { sendMessage, isResponding, cancel };
}
