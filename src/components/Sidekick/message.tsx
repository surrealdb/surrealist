import React, { useCallback, useState } from "react";
import { useCloudStore } from "~/stores/cloud";
import { ActiveChat, StreamResponse } from "./types";

export function useSidekickStream() {
	const [isResponding, setIsResponding] = useState(false);
	const [currentResponse, setCurrentResponse] = useState("");

	const sendMessage = useCallback(
		async (
			message: string,
			currentChat: ActiveChat,
			onUpdate: React.Dispatch<React.SetStateAction<ActiveChat>>,
		) => {
			if (isResponding) return;

			const { accessToken } = useCloudStore.getState();

			setIsResponding(true);
			setCurrentResponse("");

			try {
				const requestBody: { message: string; conversationId?: unknown } = { message };

				// If we have an active chat with an ID, include it in the request
				if (currentChat.id) {
					requestBody.conversationId = currentChat.id.id;
				}

				const response = await fetch(
					"https://xzg2igifvha4rfi2w677skt7h40yrtsm.lambda-url.us-east-1.on.aws/",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${accessToken}`,
						},
						body: JSON.stringify(requestBody),
					},
				);

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
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (line.trim()) {
							try {
								const data: StreamResponse = JSON.parse(line);

								switch (data.type) {
									case "start":
										onUpdate((prev) => ({
											...prev,
											id: data.data.id as any,
											messages: [
												...prev.messages,
												{
													role: "user",
													content: data.data.request.content,
												},
												{ role: "assistant", content: "" },
											],
										}));
										break;

									case "response":
										setCurrentResponse(data.data.content);
										onUpdate((prev) => ({
											...prev,
											messages: prev.messages.map((msg, i) =>
												i === prev.messages.length - 1 &&
													msg.role === "assistant"
													? { ...msg, content: data.data.content }
													: msg,
											),
										}));
										break;

									case "sources":
										onUpdate((prev) => ({
											...prev,
											messages: prev.messages.map((msg, i) =>
												i === prev.messages.length - 1 &&
													msg.role === "assistant"
													? { ...msg, sources: data.data }
													: msg,
											),
										}));
										break;

									case "title":
										onUpdate((prev) => ({
											...prev,
											title: data.data,
										}));
										break;

									case "error":
									case "failure":
										console.error("Stream error:", data.data);
										break;

									case "complete":
										// Finalize the response
										break;
								}
							} catch (e) {
								console.error("Failed to parse stream line:", line, e);
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
		},
		[isResponding],
	);

	return { sendMessage, isResponding, currentResponse };
} 