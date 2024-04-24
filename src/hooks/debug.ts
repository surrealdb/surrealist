import { useClipboard } from "@mantine/hooks";
import { useStable } from "./stable";
import { adapter } from "~/adapter";
import { useFeatureFlags } from "~/util/feature-flags";

export function useVersionCopy() {
	const [flags] = useFeatureFlags();
	const clipboard = useClipboard({ timeout: 1000 });

	const copy = useStable(async () => {
		const debugDump = await adapter.dumpDebug();
		const debugData = {
			...debugDump,
			"Version": import.meta.env.VERSION,
			"Flags": Object.entries(flags).map(([key, value]) => `${key}: ${value}`).join(", ")
		};

		const debugText = Object.entries(debugData).reduce((acc, [key, value]) => {
			return `${acc}${key}: ${value}\n`;
		}, "");

		clipboard.copy(debugText);
	});

	return [copy, clipboard] as const;
}