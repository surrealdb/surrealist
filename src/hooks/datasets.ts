import { useQuery } from "@tanstack/react-query";
import { fetchDatasetsCatalog, getVisibleDatasets } from "~/util/datasets";

export function useDatasetsCatalogQuery() {
	return useQuery({
		queryKey: ["datasets", "catalog"],
		queryFn: fetchDatasetsCatalog,
		staleTime: 60_000,
		select: getVisibleDatasets,
	});
}
