import { Group, Select, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { DatasetCatalogBrowser } from "~/components/DatasetCatalog/browser";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useDatasetsCatalogQuery } from "~/hooks/datasets";
import { getCatalogSurrealVersions, resolveDefaultCatalogSurrealVersion } from "~/util/datasets";
import { PageContainer } from "../../components/PageContainer";

export function DatasetsPage() {
	const { data: datasets } = useDatasetsCatalogQuery();
	const versionOptions = useMemo(() => {
		if (!datasets) {
			return [];
		}

		return getCatalogSurrealVersions(datasets).map((version) => ({
			value: version,
			label: `SurrealDB ${version}+`,
		}));
	}, [datasets]);

	const [surrealVersion, setSurrealVersion] = useState<string | null>(null);

	useEffect(() => {
		if (!datasets || surrealVersion) {
			return;
		}

		setSurrealVersion(resolveDefaultCatalogSurrealVersion(datasets));
	}, [datasets, surrealVersion]);

	return (
		<PageContainer>
			<PageBreadcrumbs items={[{ label: "Overview", href: "/" }, { label: "Datasets" }]} />

			<Stack gap="xl">
				<Group
					justify="space-between"
					align="flex-end"
					wrap="wrap"
					gap="md"
				>
					<Stack gap={4}>
						<PrimaryTitle fz={32}>Datasets</PrimaryTitle>
						<Text maw={600}>
							Browse and download official SurrealDB datasets and sample queries
						</Text>
					</Stack>

					<Select
						label="SurrealDB version"
						placeholder="Select a version"
						value={surrealVersion}
						onChange={setSurrealVersion}
						data={versionOptions}
						allowDeselect={false}
						w={220}
					/>
				</Group>

				{surrealVersion && (
					<DatasetCatalogBrowser
						surrealVersion={surrealVersion}
						variant="download"
					/>
				)}
			</Stack>
		</PageContainer>
	);
}
