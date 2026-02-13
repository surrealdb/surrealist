import { compareVersions } from "compare-versions";
import { CloudInstanceCapabilities, Selectable } from "~/types";

export function transformCapabilities(
	capabilities: CloudInstanceCapabilities,
): CloudInstanceCapabilities {
	const endpoints = new Set(capabilities.allowed_http_endpoints);
	const functions = new Set(capabilities.allowed_functions);

	if (!endpoints.has("*")) {
		endpoints.add("health");
		endpoints.add("rpc");
	}

	if (!functions.has("*")) {
		functions.add("type::is::array");
	}

	return {
		...capabilities,
		allowed_http_endpoints: [...endpoints],
		allowed_functions: [...functions],
	};
}

export function parseCapabilities(
	capabilities: CloudInstanceCapabilities,
): CloudInstanceCapabilities {
	const endpoints = new Set(capabilities.allowed_http_endpoints);
	const functions = new Set(capabilities.allowed_functions);

	endpoints.delete("health");
	endpoints.delete("rpc");

	functions.delete("type::is::array");

	return {
		...capabilities,
		allowed_http_endpoints: [...endpoints],
		allowed_functions: [...functions],
	};
}

type Option = Selectable & { since?: string; until?: string };

export function filterOptions(options: Option[], version: string) {
	return options.filter((option) => {
		let allowed = true;

		// Allow if version is equal to or greater than "since"
		if (option.since) {
			allowed = allowed && compareVersions(version, option.since) >= 0;
		}

		// Disallow if version is less than "until"
		if (option.until) {
			allowed = allowed && compareVersions(version, option.until) < 0;
		}

		return allowed;
	});
}
