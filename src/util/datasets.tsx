import { useQuery } from "@tanstack/react-query";
import { compareVersions } from "compare-versions";
import { sleep } from "radash";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import {
	Connection,
	Dataset,
	DatasetQuery,
	DatasetQueryInfo,
	DatasetSize,
	DatasetVersion,
	StartingDataDatasetOptions,
} from "~/types";
import { createBaseQuery } from "./defaults";
import { showErrorNotification, showInfo } from "./helpers";
import { syncConnectionSchema } from "./schema";
import { APPLY_DATASET_ID_KEY, APPLY_DATASET_SIZE_KEY, APPLY_DATASET_VERSION_KEY } from "./storage";

const DATASETS_BASE_URL = "https://datasets.surrealdb.com";

export function useDatasetsQuery() {
	return useQuery({
		queryKey: ["datasets"],
		queryFn: async () => {
			const datasets = await fetchDatasets();

			return datasets ?? [];
		},
	});
}

/**
 * Fetch a list of available datasets
 *
 * @returns A list of datasets
 */
export async function fetchDatasets(): Promise<Dataset[]> {
	const datasets: Dataset[] = await fetch("https://datasets.surrealdb.com/datasets.json").then(
		(res) => res.json(),
	);

	return datasets;
}

/**
 * Get a dataset from its id
 *
 * @param id The id of the dataset
 * @returns The dataset or null if not found
 */
export async function fetchDatasetFromId(id?: string): Promise<Dataset | null> {
	if (!id) {
		return null;
	}

	const datasets = await fetchDatasets();

	return datasets.find((dataset) => dataset.id === id) ?? null;
}

/**
 * Get a dataset version from its id
 *
 * @param dataset The dataset
 * @param id The id of the version
 * @returns The version or null if not found
 */
export async function getDatasetVersionById(
	dataset: Dataset,
	id: string,
): Promise<DatasetVersion | null> {
	return dataset.versions?.find((version) => version.id === id) ?? null;
}

/**
 * Fetch a dataset version from its id
 *
 * @param datasetId The id of the dataset
 * @param id The id of the version
 * @returns The version or null if not found
 */
export async function fetchDatasetVersionById(
	datasetId: string,
	versionId: string,
): Promise<DatasetVersion | null> {
	const dataset = await fetchDatasetFromId(datasetId);

	if (!dataset) {
		return null;
	}

	return getDatasetVersionById(dataset, versionId);
}

/**
 * Get a dataset size from its id
 *
 * @param version The version
 * @param id The id of the size
 * @returns The size or null if not found
 */
export async function getDatasetSizeById(
	version: DatasetVersion,
	id: string,
): Promise<DatasetSize | null> {
	return version.sizes?.find((size) => size.id === id) ?? null;
}

/**
 * Fetch a dataset size from its id
 *
 * @param datasetId The id of the dataset
 * @param versionId The id of the version
 * @param sizeId The id of the size
 * @returns The size or null if not found
 */
export async function fetchDatasetSizeById(
	datasetId: string,
	versionId: string,
	sizeId: string,
): Promise<DatasetSize | null> {
	const version = await fetchDatasetVersionById(datasetId, versionId);

	if (!version) {
		return null;
	}

	return getDatasetSizeById(version, sizeId);
}

/**
 * Get the sample queries for a version
 *
 * @param version The version
 * @returns The sample queries or null if not found
 */
export async function getSampleQueriesForVersion(
	version: DatasetVersion,
): Promise<DatasetQueryInfo[]> {
	return version.sampleQueries ?? [];
}

/**
 * Fetch the data for a dataset size
 *
 * @param size The size
 * @returns The data
 */
export async function fetchDatasetSchema(size: DatasetSize): Promise<string> {
	const response = await fetch(`${DATASETS_BASE_URL}/${size.path}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch dataset data: ${response.statusText}`);
	}

	const data = await response.text();
	return data;
}

/**
 * Fetch the queries for a version
 *
 * @param version The version
 * @returns The queries
 */
export async function fetchDatasetQueries(version: DatasetVersion): Promise<DatasetQuery[]> {
	const queries: DatasetQuery[] = [];

	version.sampleQueries?.forEach(async (query) => {
		const response = await fetch(`${DATASETS_BASE_URL}/${query.path}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch dataset query: ${response.statusText}`);
		}

		const data = await response.text();

		queries.push({
			id: query.id,
			label: query.label,
			query: data,
		});
	});

	return queries;
}

/**
 * Apply the queries for a dataset version
 *
 * @param version The version
 * @param connection The connection
 * @returns The query configurations
 */
export async function applyDatasetQueries(version: DatasetVersion, connection: Connection) {
	const { settings, updateConnection } = useConfigStore.getState();
	const queries = await fetchDatasetQueries(version);

	if (!queries || queries.length === 0) {
		showErrorNotification({
			title: "Failed to apply dataset queries",
			content: "No queries found",
		});
		return;
	}

	const queryConfigs = queries?.map((query) => ({
		...createBaseQuery(settings, "config"),
		name: query.label,
		query: query.query,
	}));

	updateConnection({
		id: connection.id,
		activeQuery: queryConfigs[0].id,
		queries: queryConfigs,
	});

	return queryConfigs;
}

/**
 * Schedule the application of a dataset
 *
 * @param identifier The identifier of the instance
 * @param connection The connection
 * @param datasetOptions The dataset options
 */
export async function scheduleApplyDatasetFile(
	identifier: string,
	connection: Connection,
	datasetOptions: StartingDataDatasetOptions,
) {
	const dataset = await fetchDatasetFromId(datasetOptions?.id);

	if (!dataset) {
		throw new Error("Dataset not found");
	}

	const version = dataset.versions?.find((it) => it.id === datasetOptions?.version);

	if (!version) {
		throw new Error("Version not found");
	}

	const size = version.sizes?.find((it) => it.id === datasetOptions?.size);

	if (!size) {
		throw new Error("Size not found");
	}

	const addQueries = datasetOptions?.addQueries;

	sessionStorage.setItem(`${APPLY_DATASET_ID_KEY}:${identifier}`, dataset.id);
	sessionStorage.setItem(`${APPLY_DATASET_VERSION_KEY}:${identifier}`, version.id);
	sessionStorage.setItem(`${APPLY_DATASET_SIZE_KEY}:${identifier}`, size.id);

	if (addQueries) {
		await applyDatasetQueries(version, connection);
	}
}

/**
 * Get the latest compatible version for a dataset
 *
 * @param dataset The dataset
 * @param instanceVersion The version of the instance
 * @returns The latest compatible version or undefined if not found
 */
export function getLatestCompatibleVersion(
	dataset: Dataset | undefined,
	instanceVersion: string,
): DatasetVersion | undefined {
	if (!dataset || dataset?.versions?.length === 0) {
		return undefined;
	}

	return [...dataset.versions]
		.reverse()
		.find((version) => compareVersions(instanceVersion, version.minimumVersion) >= 0);
}

/**
 * Fetch the latest compatible version for a dataset
 *
 * @param datasetId The id of the dataset
 * @param instanceVersion The version of the instance
 * @returns The latest compatible version or undefined if not found
 */
export async function fetchLatestCompatibleVersion(
	datasetId: string,
	instanceVersion: string,
): Promise<DatasetVersion | undefined> {
	const dataset = await fetchDatasetFromId(datasetId);

	if (!dataset) {
		return undefined;
	}

	return getLatestCompatibleVersion(dataset, instanceVersion);
}

/**
 * Get the default dataset
 *
 * @param instanceVersion The version of the instance
 * @param addQueries Whether to add queries to the dataset
 * @returns The default dataset options
 */
export async function getDefaultDatasetOptions(
	instanceVersion: string,
	addQueries: boolean,
): Promise<StartingDataDatasetOptions> {
	const datasetId = "surreal-deal-store";
	const version = await fetchLatestCompatibleVersion(datasetId, instanceVersion);

	return {
		id: datasetId,
		version: version?.id ?? "3.0",
		size: "mini",
		addQueries: addQueries,
	};
}

export async function applyDatasetFile(datasetId: string, versionId: string, sizeId: string) {
	const dataset = await fetchDatasetFromId(datasetId);

	if (!dataset) {
		showErrorNotification({
			title: "Failed to apply dataset",
			content: "Dataset not found",
		});
		return;
	}

	const size = await fetchDatasetSizeById(datasetId, versionId, sizeId);

	if (!size) {
		showErrorNotification({
			title: "Failed to apply dataset",
			content: "Size not found",
		});
		return;
	}

	try {
		const schema = await fetchDatasetSchema(size);

		await sleep(50);
		await executeQuery(schema);
		await syncConnectionSchema();

		showInfo({
			title: "Dataset loaded",
			subtitle: `${dataset.label} - ${size.label} has been applied`,
		});
	} catch (error) {
		showErrorNotification({
			title: "Failed to apply dataset",
			content: error,
		});
	}
}
