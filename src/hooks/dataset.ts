import { sleep } from "radash";
import { useState } from "react";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { showInfo } from "~/util/helpers";
import { getDatasetURL } from "~/util/language";
import { syncConnectionSchema } from "~/util/schema";
import { useStable } from "./stable";

/**
 * Provides the necessary data and methods to apply datasets
 */
export function useDatasets() {
	const [isLoading, setIsLoading] = useState(false);

	const applyDataset = useStable(async (version: string) => {
		setIsLoading(true);

		try {
			const source = getDatasetURL(version);
			const dataset = await fetch(source).then((res) => res.text());

			await sleep(50);
			await executeQuery(dataset);
			await syncConnectionSchema();

			showInfo({
				title: "Dataset loaded",
				subtitle: `The dataset has been applied`,
			});
		} finally {
			setIsLoading(false);
		}
	});

	return [applyDataset, isLoading] as const;
}
