import { cloneElement, isValidElement } from "react";

export function extractAlertTitle(children: React.ReactNode): string | undefined {
	if (!children) return undefined;

	if (typeof children === "string") {
		return children.trim() || undefined;
	}

	if (Array.isArray(children)) {
		for (const child of children) {
			const title = extractAlertTitle(child);
			if (title) return title;
		}
		return undefined;
	}

	if (isValidElement(children)) {
		const props = children.props as { className?: string; children?: React.ReactNode };
		const { className, children: elementChildren } = props;

		if (className?.includes("markdown-alert-title")) {
			return extractTextFromNode(elementChildren);
		}

		if (children.type === "p" && elementChildren) {
			const textContent = extractTextFromNode(elementChildren);
			return textContent?.trim() || undefined;
		}

		return extractAlertTitle(elementChildren);
	}

	return undefined;
}

export function extractTextFromNode(node: React.ReactNode): string {
	if (typeof node === "string") return node;
	if (Array.isArray(node)) return node.map(extractTextFromNode).join("");
	if (isValidElement(node)) return extractTextFromNode(node.props?.children);
	return "";
}

export function filterAlertTitle(children: React.ReactNode): React.ReactNode {
	if (!children) return children;

	if (Array.isArray(children)) {
		return children
			.map((child) => {
				if (isValidElement(child)) {
					const props = child.props as { className?: string; children?: React.ReactNode };
					const { className, children: elementChildren } = props;

					if (className?.includes("markdown-alert-title")) {
						return null;
					}

					const filteredChildren = filterAlertTitle(elementChildren);
					return cloneElement(child as React.ReactElement<any>, {
						children: filteredChildren,
					});
				}
				return child;
			})
			.filter(Boolean);
	}

	return children;
}
