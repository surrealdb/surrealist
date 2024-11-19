declare module "*.md" {
	const attributes: Record<string, unknown>;
	const html: string;

	export { attributes, html };
}

declare module "@lezer/php" {
	export const parser: any;
}

declare module "@fig/lezer-bash" {
	export const parser: any;
}
