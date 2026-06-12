import {
	Button,
	Center,
	Checkbox,
	Group,
	Loader,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { Icon, iconTable } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useConnection, useMinimumVersion, useRequireDatabase } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useDatasetsCatalogQuery } from "~/hooks/datasets";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import {
	appendQueriesToConnection,
	type DatasetCatalogEntry,
	type DatasetCatalogVersion,
	fetchSampleQueries,
	getVisibleSampleQueries,
	getVisibleSizes,
	resolveDatasetVersion,
} from "~/util/datasets";
import { showErrorNotification } from "~/util/helpers";

interface DatasetCardProps {
	dataset: DatasetCatalogEntry;
	version: DatasetCatalogVersion;
}

function DatasetCard({ dataset, version }: DatasetCardProps) {
	const connectionId = useConnection((c) => c?.id ?? "");
	const navigateConnection = useConnectionNavigator();
	const [applyDataset, isApplying] = useDatasets();
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [includeQueries, setIncludeQueries] = useState(true);

	const sizes = useMemo(() => getVisibleSizes(version), [version]);
	const sampleQueries = useMemo(() => getVisibleSampleQueries(version), [version]);

	const sizeOptions = useMemo(
		() =>
			sizes.map((size) => ({
				value: size.id,
				label: size.label,
			})),
		[sizes],
	);

	const activeSize = selectedSize ?? sizes[0]?.id ?? null;
	const activeSizePath = sizes.find((size) => size.id === activeSize)?.path;
	const hasSizes = sizes.length > 0;
	const hasQueries = sampleQueries.length > 0;
	const canApplyDataset = hasSizes && !!activeSizePath;
	const canApplyQueries = hasQueries && includeQueries;
	const canApply = canApplyDataset || canApplyQueries;

	const handleApply = useRequireDatabase(
		useStable(async () => {
			if (!canApply) {
				return;
			}

			try {
				if (canApplyDataset && activeSizePath) {
					await applyDataset(activeSizePath);
				}

				if (canApplyQueries) {
					const queries = await fetchSampleQueries(sampleQueries);
					appendQueriesToConnection(
						queries,
						queries.map((query) => query.name),
					);

					if (connectionId) {
						navigateConnection(connectionId, "query");
					}
				}
			} catch (error) {
				showErrorNotification({
					title: "Failed to apply dataset",
					content: error,
				});
			}
		}),
	);

	return (
		<Paper
			p="lg"
			radius="md"
			withBorder
			h="100%"
		>
			<Stack
				gap="l"
				h="100%"
			>
				<Group wrap="nowrap">
					<PrimaryTitle fz={18}>{dataset.label}</PrimaryTitle>
					<Spacer />
					<Icon
						path={iconTable}
						c="obsidian"
					/>
				</Group>
				<Text
					mb="md"
					className="selectable"
				>
					{dataset.description}
				</Text>

				<Stack
					gap="lg"
					mt="auto"
				>
					{hasQueries ? (
						<Checkbox
							label="Include sample queries"
							checked={includeQueries}
							onChange={(event) => setIncludeQueries(event.currentTarget.checked)}
						/>
					) : (
						<Text fz="sm">No sample queries available</Text>
					)}

					<Group
						gap="lg"
						wrap="nowrap"
						justify="space-between"
					>
						<Select
							w="50%"
							aria-label="Size"
							placeholder={hasSizes ? "Size" : "Default size"}
							value={activeSize}
							onChange={setSelectedSize}
							data={sizeOptions}
							allowDeselect={false}
							disabled={!hasSizes}
						/>
						<Button
							w="50%"
							variant="gradient"
							onClick={handleApply}
							loading={isApplying}
							disabled={!canApply}
						>
							Apply
						</Button>
					</Group>
				</Stack>
			</Stack>
		</Paper>
	);
}

export function DatasetBrowser() {
	const [, connectedVersion] = useMinimumVersion("0.0.0");
	const dbVersion = connectedVersion || import.meta.env.SDB_VERSION;
	const { data: datasets, isPending, isError } = useDatasetsCatalogQuery();

	const compatibleDatasets = useMemo(() => {
		if (!datasets) {
			return [];
		}

		return datasets.flatMap((dataset) => {
			const version = resolveDatasetVersion(dataset, dbVersion);

			if (!version) {
				return [];
			}

			return [{ dataset, version }];
		});
	}, [datasets, dbVersion]);

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
		return <Text>No datasets are compatible with your database version.</Text>;
	}

	return (
		<SimpleGrid
			cols={{ base: 1, sm: 2, lg: 3 }}
			spacing="lg"
		>
			{compatibleDatasets.map(({ dataset, version }) => (
				<DatasetCard
					key={dataset.id}
					dataset={dataset}
					version={version}
				/>
			))}
		</SimpleGrid>
	);
}
