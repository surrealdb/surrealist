declare module "dagre";

declare module '*.md' {
	const attributes: Record<string, unknown>;
	const html: string;

	export { attributes, html };
}