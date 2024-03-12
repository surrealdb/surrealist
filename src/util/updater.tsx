import { gt } from "semver";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { showInfo } from "./helpers";

export async function runUpdateChecker(lastPromptedVersion: string | null, force: boolean) {
	if (import.meta.env.MODE === "development") {
		return;
	}

	const { setLastPromptedVersion } = useConfigStore.getState();
	const { setAvailableUpdate } = useInterfaceStore.getState();

	try {
		const response = await fetch("https://api.github.com/repos/surrealdb/surrealist/releases/latest");
		const result = await response.json();
		const version = result.tag_name.slice(1);
		const current = import.meta.env.VERSION;

		if (version == lastPromptedVersion && !force) {
			return;
		}

		if (gt(version, current)) {
			setAvailableUpdate(version);
			setLastPromptedVersion(version);
		} else if (force) {
			showInfo({
				title: "Update checker",
				subtitle: "Surrealist is up-to-date!",
			});
		}
	} catch (err) {
		console.warn("Failed to check for updates", err);
	}
}
