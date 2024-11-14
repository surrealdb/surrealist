import { useMutation } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudChatMessage } from "~/types";

const APP_ID = import.meta.env.VITE_SCOUT_APP_ID;
const API_KEY = import.meta.env.VITE_SCOUT_API_KEY;
const ENDPOINT = `https://api-prod.scoutos.com/v2/workflows/${APP_ID}/execute`;

type Inputs = {
	input: string;
	conversation: CloudChatMessage[];
};

export function useCopilotMutation() {
	const { setChatThreadId, pushChatMessage } = useCloudStore.getState();

	const threadId = useCloudStore((s) => s.chatThreadId);

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${API_KEY}`,
	};

	console.log(headers);
	console.log(ENDPOINT);

	return useMutation({
		mutationKey: ["cloud", "support", "message"],
		mutationFn: async (inputs: Inputs) => {
			const res = await fetch(ENDPOINT, {
				method: "POST",
				headers,
				body: JSON.stringify({
					streaming: false,
				}),
			}).then((res) => res.json());

			console.log(res);

			return "Example";

			// const output = res?.outputs?.output?.output;
			// if (!output) return "Failed to send message";

			// adapter.log("Sidekick", `Received response: ${output}`);

			// setChatThreadId(res.thread_id);
			// return output;
		},
	});
}
