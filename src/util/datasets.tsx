import { compareVersions } from "compare-versions";
import { adapter } from "~/adapter";
import { SURQL_FILTER } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { getConnection } from "~/util/connection";
import type { DatasetQuery } from "~/util/dataset";
import { createBaseQuery } from "~/util/defaults";

export interface DatasetCatalogQuery {
	id: string;
	label: string;
	path: string;
}

export interface DatasetCatalogSize {
	id: string;
	hidden: boolean;
	label: string;
	path: string;
}

export interface DatasetCatalogVersion {
	id: string;
	hidden: boolean;
	minimumVersion: string;
	sizes?: DatasetCatalogSize[];
	sampleQueries?: DatasetCatalogQuery[];
}

export interface DatasetCatalogEntry {
	id: string;
	label: string;
	description: string;
	author: string;
	hidden: boolean;
	showForDeploy: boolean;
	versions: DatasetCatalogVersion[];
}

export const DATASETS_BASE_URL =
	import.meta.env.VITE_DATASETS_URL ?? "https://datasets.surrealdb.com";

const DATASETS_CATALOG_PATH = "datasets.json";

export function getDatasetAssetUrl(path: string) {
	const normalized = path.startsWith("/") ? path.slice(1) : path;

	return `${DATASETS_BASE_URL}/${normalized}`;
}

export async function fetchDatasetsCatalog() {
	const response = await fetch(getDatasetAssetUrl(DATASETS_CATALOG_PATH));

	if (!response.ok) {
		throw new Error(`Failed to fetch datasets catalog: ${response.statusText}`);
	}

	return (await response.json()) as DatasetCatalogEntry[];
}

export function getVisibleDatasets(catalog: DatasetCatalogEntry[]) {
	return catalog.filter((dataset) => !dataset.hidden);
}

export function getCatalogSurrealVersions(catalog: DatasetCatalogEntry[]) {
	const versions = new Set<string>();

	for (const dataset of getVisibleDatasets(catalog)) {
		for (const version of dataset.versions) {
			if (!version.hidden) {
				versions.add(version.minimumVersion);
			}
		}
	}

	return [...versions].sort((a, b) => compareVersions(b, a));
}

export function resolveDefaultCatalogSurrealVersion(catalog: DatasetCatalogEntry[]) {
	const versions = getCatalogSurrealVersions(catalog);

	return versions[0] ?? import.meta.env.SDB_VERSION;
}

export function resolveDatasetVersion(dataset: DatasetCatalogEntry, dbVersion: string) {
	if (!dbVersion) {
		return null;
	}

	const compatible = dataset.versions
		.filter((version) => !version.hidden)
		.filter((version) => compareVersions(dbVersion, version.minimumVersion) >= 0)
		.sort((a, b) => compareVersions(b.minimumVersion, a.minimumVersion));

	return compatible[0] ?? null;
}

export function getVisibleSizes(version: DatasetCatalogVersion) {
	return version.sizes?.filter((size) => !size.hidden) ?? [];
}

export function getVisibleSampleQueries(version: DatasetCatalogVersion) {
	return version.sampleQueries ?? [];
}

export async function fetchDatasetText(path: string) {
	const response = await fetch(getDatasetAssetUrl(path));

	if (!response.ok) {
		throw new Error(`Failed to fetch dataset file: ${response.statusText}`);
	}

	return response.text();
}

export async function fetchSampleQueries(queries: DatasetCatalogQuery[]) {
	return Promise.all(
		queries.map(async (query) => ({
			name: query.label,
			query: await fetchDatasetText(query.path),
		})),
	);
}

export function findDataset(catalog: DatasetCatalogEntry[], id: string) {
	return catalog.find((dataset) => dataset.id === id);
}

export function resolveDatasetSizePath(
	dataset: DatasetCatalogEntry,
	sizeId: string,
	dbVersion: string,
) {
	const version = resolveDatasetVersion(dataset, dbVersion);
	const size = getVisibleSizes(version ?? { id: "", hidden: false, minimumVersion: "0" }).find(
		(entry) => entry.id === sizeId,
	);

	return size?.path ?? null;
}

function getCatalogSizeIds(catalog: DatasetCatalogEntry[]) {
	const sizeIds = new Set<string>();

	for (const dataset of catalog) {
		for (const version of dataset.versions) {
			for (const size of getVisibleSizes(version)) {
				sizeIds.add(size.id);
			}
		}
	}

	return [...sizeIds].sort((a, b) => b.length - a.length);
}

function parseCatalogDatasetSource(source: string, catalog: DatasetCatalogEntry[]) {
	if (findDataset(catalog, source)) {
		return { datasetId: source };
	}

	for (const sizeId of getCatalogSizeIds(catalog)) {
		const suffix = `-${sizeId}`;

		if (!source.endsWith(suffix)) {
			continue;
		}

		const datasetId = source.slice(0, -suffix.length);

		if (findDataset(catalog, datasetId)) {
			return { datasetId, sizeId };
		}
	}

	return null;
}

function resolveDatasetImportPath(
	datasetId: string,
	sizeId: string | undefined,
	dbVersion: string,
	catalog: DatasetCatalogEntry[],
) {
	const dataset = findDataset(catalog, datasetId);

	if (!dataset) {
		return null;
	}

	const version = resolveDatasetVersion(dataset, dbVersion);
	const sizes = getVisibleSizes(version ?? { id: "", hidden: false, minimumVersion: "0" });

	if (sizes.length === 0) {
		throw new Error(`Dataset "${datasetId}" has no importable data files`);
	}

	if (sizeId) {
		const size = sizes.find((entry) => entry.id === sizeId);

		if (!size?.path) {
			throw new Error(`Dataset "${datasetId}" has no "${sizeId}" size`);
		}

		return size.path;
	}

	const path = sizes[0]?.path;

	if (!path) {
		throw new Error(`Dataset "${datasetId}" has no importable data files`);
	}

	return path;
}

/**
 * Resolve a dataset reference from a mini-embed URL `dataset` parameter to a fetchable URL.
 *
 * - Full `http(s)://` URLs are returned unchanged.
 * - CDN paths (e.g. `/learn/fundamentals/fundamentals-part-1.surql`) are served from datasets.surrealdb.com.
 * - Catalog references resolve via datasets.json using `{datasetId}` or `{datasetId}-{sizeId}`.
 */
export async function resolveMiniEmbedDatasetUrl(source: string, dbVersion: string) {
	if (source.startsWith("http://") || source.startsWith("https://")) {
		return source;
	}

	if (source.startsWith("/") || source.endsWith(".surql")) {
		return getDatasetAssetUrl(source);
	}

	const catalog = await fetchDatasetsCatalog();
	const parsed = parseCatalogDatasetSource(source, catalog);

	if (parsed) {
		const path = resolveDatasetImportPath(parsed.datasetId, parsed.sizeId, dbVersion, catalog);

		if (path) {
			return getDatasetAssetUrl(path);
		}
	}

	throw new Error(`Invalid dataset source: ${source}`);
}

export async function fetchDatasetFromUrl(url: string) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch dataset (${response.status})`);
	}

	return response.text();
}

export async function resolveDefaultDeployDatasetPath(dbVersion: string) {
	const catalog = await fetchDatasetsCatalog();
	const dataset =
		findDataset(catalog, "surreal-deal-store") ??
		getVisibleDatasets(catalog).find((entry) => entry.showForDeploy);

	if (!dataset) {
		return null;
	}

	const version = resolveDatasetVersion(dataset, dbVersion);
	const sizes = getVisibleSizes(version ?? { id: "", hidden: false, minimumVersion: "0" });

	return sizes.find((size) => size.id === "mini")?.path ?? sizes[0]?.path ?? null;
}

export function appendQueriesToConnection(queries: DatasetQuery[], replaceNames: string[] = []) {
	const { settings, updateConnection } = useConfigStore.getState();
	const connection = getConnection();

	if (!connection || queries.length === 0) {
		return;
	}

	const configs = queries.map((query) => ({
		...createBaseQuery(settings, "config"),
		name: query.name,
		query: query.query,
	}));

	const replace = new Set(replaceNames);
	const existingQueries = connection.queries.filter(
		(query) => query.query.length > 0 && !replace.has(query.name ?? ""),
	);

	updateConnection({
		id: connection.id,
		activeQuery: configs[0].id,
		queries: [...configs, ...existingQueries],
	});
}

export async function buildDatasetDownloadContent(
	dataset: DatasetCatalogEntry,
	version: DatasetCatalogVersion,
	sizeId: string | null,
	includeQueries: boolean,
) {
	const parts: string[] = [];
	const sizes = getVisibleSizes(version);
	const activeSize = sizes.find((size) => size.id === sizeId) ?? sizes[0];

	if (activeSize?.path) {
		parts.push(await fetchDatasetText(activeSize.path));
	}

	if (includeQueries) {
		const queries = await fetchSampleQueries(getVisibleSampleQueries(version));

		if (queries.length > 0) {
			parts.push(queries.map((query) => query.query).join("\n\n"));
		}
	}

	return {
		content: parts.join("\n\n"),
		filename: `${dataset.id}${activeSize ? `-${activeSize.id}` : ""}.surql`,
	};
}

export async function downloadDataset(
	dataset: DatasetCatalogEntry,
	version: DatasetCatalogVersion,
	sizeId: string | null,
	includeQueries: boolean,
) {
	const { content, filename } = await buildDatasetDownloadContent(
		dataset,
		version,
		sizeId,
		includeQueries,
	);

	if (!content) {
		return false;
	}

	return adapter.saveFile("Save dataset", filename, [SURQL_FILTER], async () => content);
}

export async function loadDatasetSampleQueries(datasetId: string, dbVersion: string) {
	const catalog = await fetchDatasetsCatalog();
	const dataset = findDataset(catalog, datasetId);

	if (!dataset) {
		return [];
	}

	const version = resolveDatasetVersion(dataset, dbVersion);

	if (!version) {
		return [];
	}

	return fetchSampleQueries(getVisibleSampleQueries(version));
}
