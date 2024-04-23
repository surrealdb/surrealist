import compare from "semver-compare";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";

const CHANGELOGS = import.meta.glob("~/assets/changelogs/*.md", { eager: true });

export const changelogs = Object.entries(CHANGELOGS).map(([path, value]: any) => {
	const [, version] = path.match(/\/([\d.]+).md$/) || [];

	return {
		version,
		metadata: value.attributes,
		content: value.html
	};
}).sort((a, b) => {
	return compare(b.version, a.version);
});

export function promptChangelog() {
	const { previousVersion, setPreviousVersion } = useConfigStore.getState();
	const { showChangelog } = useInterfaceStore.getState();

	if (compare(import.meta.env.VERSION, previousVersion) > 0) {
		setPreviousVersion(import.meta.env.VERSION);
		showChangelog();
	}
}