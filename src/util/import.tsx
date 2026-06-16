import {
	Features,
	HttpConnectionError,
	UnexpectedConnectionError,
	UnsupportedFeatureError,
} from "surrealdb";

interface ImportQueryResult {
	status: string;
	result?: unknown;
}

function isImportRequest(input: RequestInfo | URL) {
	const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

	return new URL(url).pathname.endsWith("/import");
}

function formatImportStatementError(result: ImportQueryResult) {
	if (typeof result.result === "string") {
		return result.result;
	}

	if (result.result && typeof result.result === "object" && "message" in result.result) {
		return String((result.result as { message: string }).message);
	}

	return JSON.stringify(result.result ?? result);
}

export function assertImportResponseSucceeded(body: string) {
	const trimmed = body.trim();
	if (!trimmed) {
		return;
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(trimmed);
	} catch {
		return;
	}

	if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
		const error = parsed as Record<string, unknown>;

		if ("message" in error && ("code" in error || "kind" in error)) {
			throw new Error(String(error.message));
		}
	}

	const results = (Array.isArray(parsed) ? parsed : [parsed]) as ImportQueryResult[];
	const failures = results.filter((result) => result.status && result.status !== "OK");

	if (failures.length === 0) {
		return;
	}

	const firstError = formatImportStatementError(failures[0]);

	throw new Error(
		failures.length === 1
			? `Import failed: ${firstError}`
			: `Import failed with ${failures.length} statement errors. First error: ${firstError}`,
	);
}

/**
 * Wrap fetch so SDK import calls surface statement-level failures returned with
 * HTTP 200. The SDK only checks the status code and would otherwise report
 * success for partial imports.
 */
export function createImportAwareFetch(fetchImpl: typeof fetch = globalThis.fetch): typeof fetch {
	return async (input, init) => {
		const response = await fetchImpl(input, init);

		if (!isImportRequest(input) || !response.ok) {
			return response;
		}

		const body = await response.clone().text();
		assertImportResponseSucceeded(body);

		return response;
	};
}

/**
 * Whether a failed stream import should fall back to a blob import. Import and
 * validation errors must not be retried, as that can leave a partially imported
 * database while still reporting success on the second attempt.
 */
export function shouldFallbackStreamImport(err: unknown) {
	if (err instanceof UnsupportedFeatureError) {
		return err.feature === Features.ExportImportRaw;
	}

	if (err instanceof UnexpectedConnectionError) {
		return true;
	}

	if (err instanceof HttpConnectionError) {
		// Retry only likely transport failures, not request or statement errors.
		return err.status === 0 || err.status >= 502;
	}

	return false;
}
