import { Center, Loader, SimpleGrid, Text } from "@mantine/core";
import { useMemo } from "react";
import { useDatasetsCatalogQuery } from "~/hooks/datasets";
import {
	getVisibleSizes,
	resolveDatasetVersionForCatalog,
	resolveDatasetVersionForDatabase,
} from "~/util/datasets";
import { DatasetCatalogCard } from "./card";

export type DatasetVersionResolution = "catalog" | "database";

export interface DatasetCatalogBrowserProps {
	surrealVersion: string;
	disabled?: boolean;
	variant: "apply" | "download";
	versionResolution?: DatasetVersionResolution;
}

export function DatasetCatalogBrowser({
	surrealVersion,
	disabled,
	variant,
	versionResolution = "catalog",
}: DatasetCatalogBrowserProps) {
	const { data: datasets, isPending, isError } = useDatasetsCatalogQuery();

	const compatibleDatasets = useMemo(() => {
		if (!datasets) {
			return [];
		}

		return datasets.flatMap((dataset) => {
			const version =
				versionResolution === "database"
					? resolveDatasetVersionForDatabase(dataset, surrealVersion)
					: resolveDatasetVersionForCatalog(dataset, surrealVersion);

			if (!version) {
				return [];
			}

			if (variant === "download" && getVisibleSizes(version).length === 0) {
				return [];
			}

			return [{ dataset, version }];
		});
	}, [datasets, surrealVersion, variant, versionResolution]);

	if (isPending) {
		return (
			<Center py="xl">
				<Loader />
			</Center>
		);
	}

	if (isError || !datasets) {
		return <Text>Failed to load the dataset catalog. Please try again later.</Text>;
	}

	if (compatibleDatasets.length === 0) {
		return <Text>No datasets are compatible with SurrealDB {surrealVersion}.</Text>;
	}

	return (
		<SimpleGrid
			cols={{ base: 1, sm: 2, lg: 3 }}
			spacing="lg"
		>
			{compatibleDatasets.map(({ dataset, version }) => (
				<DatasetCatalogCard
					key={dataset.id}
					dataset={dataset}
					version={version}
					variant={variant}
					disabled={disabled}
				/>
			))}
		</SimpleGrid>
	);
}
