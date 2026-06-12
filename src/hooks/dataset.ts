import { sleep } from "radash";
import { useState } from "react";
import { getSurreal } from "~/screens/surrealist/pages/Connection/connection/connection";
import { getDatasetAssetUrl } from "~/util/datasets";
import { showInfo } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";
import { useStable } from "./stable";

/**
 * Provides the necessary data and methods to apply datasets
 */
export function useDatasets() {
	const [isLoading, setIsLoading] = useState(false);

	const applyDataset = useStable(async (path: string) => {
		setIsLoading(true);

		try {
			const response = await fetch(getDatasetAssetUrl(path));
			const dataset = await response.blob();

			await sleep(50);
			await getSurreal().import(dataset);
			await syncConnectionSchema();

			showInfo({
				title: "Dataset loaded",
				subtitle: "The dataset has been applied",
			});
		} finally {
			setIsLoading(false);
		}
	});

	return [applyDataset, isLoading] as const;
}
