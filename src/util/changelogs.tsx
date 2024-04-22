const CHANGELOGS = import.meta.glob("~/assets/changelogs/*.md", { eager: true });

export const changelogs = Object.entries(CHANGELOGS).map(([path, value]: any) => {
	const [, version] = path.match(/\/([\d.]+).md$/) || [];

	return {
		version,
		metadata: value.attributes,
		content: value.html
	};
});