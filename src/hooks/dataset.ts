import { sleep } from "radash";
import { useMemo, useState } from "react";
import { DATASETS } from "~/constants";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import type { DatasetType, Selectable } from "~/types";
import { showInfo } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";
import { parseDatasetURL } from "~/util/surrealql";
import { useStable } from "./stable";

/**
 * Provides the necessary data and methods to apply datasets
 */
export function useDatasets() {
	const [isLoading, setIsLoading] = useState(false);

	const datasets = useMemo<Selectable[]>(() => {
		return Object.entries(DATASETS).map(([id, info]) => ({
			value: id,
			label: info.name,
		}));
	}, []);

	const applyDataset = useStable(async (id: DatasetType) => {
		const info = DATASETS[id];

		if (!info) {
			throw new Error("Dataset not found");
		}

		setIsLoading(true);

		try {
			const source = parseDatasetURL(id);
			const dataset = await fetch(source).then((res) => res.text());

			await sleep(50);
			await executeQuery(dataset);
			await syncConnectionSchema();

			showInfo({
				title: "Dataset loaded",
				subtitle: `${info.name} has been applied`,
			});
		} finally {
			setIsLoading(false);
		}
	});

	return [datasets, applyDataset, isLoading] as const;
}
