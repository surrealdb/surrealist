import { compareVersions } from "compare-versions";
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
