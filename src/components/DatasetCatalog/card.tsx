import { Button, Checkbox, Group, Paper, Select, Stack, Text } from "@mantine/core";
import { Icon, iconDownload, iconSandbox } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useConnection, useRequireDatabase } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import {
	appendQueriesToConnection,
	type DatasetCatalogEntry,
	type DatasetCatalogVersion,
	downloadDataset,
	fetchSampleQueries,
	getVisibleSampleQueries,
	getVisibleSizes,
} from "~/util/datasets";
import { showErrorNotification } from "~/util/helpers";

export interface DatasetCatalogCardProps {
	dataset: DatasetCatalogEntry;
	version: DatasetCatalogVersion;
	variant: "apply" | "download";
}

export function DatasetCatalogCard({ dataset, version, variant }: DatasetCatalogCardProps) {
	const connectionId = useConnection((c) => c?.id ?? "");
	const navigateConnection = useConnectionNavigator();
	const [applyDataset, isApplying] = useDatasets();
	const [isDownloading, setIsDownloading] = useState(false);
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
	const canSubmit = variant === "download" ? canApplyDataset : canApplyDataset || canApplyQueries;
	const isLoading = variant === "apply" ? isApplying : isDownloading;

	const handleApply = useRequireDatabase(
		useStable(async () => {
			if (!canSubmit) {
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

	const handleDownload = useStable(async () => {
		if (!canSubmit) {
			return;
		}

		setIsDownloading(true);

		try {
			await downloadDataset(dataset, version, activeSize, false);
		} catch (error) {
			showErrorNotification({
				title: "Failed to download dataset",
				content: error,
			});
		} finally {
			setIsDownloading(false);
		}
	});

	const handleSubmit = variant === "apply" ? handleApply : handleDownload;

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
						path={iconSandbox}
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
					{variant === "apply" &&
						(hasQueries ? (
							<Checkbox
								label="Include sample queries"
								checked={includeQueries}
								onChange={(event) => setIncludeQueries(event.currentTarget.checked)}
							/>
						) : (
							<Text fz="sm">No sample queries available</Text>
						))}

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
							onClick={handleSubmit}
							loading={isLoading}
							disabled={!canSubmit}
							leftSection={
								variant === "download" ? <Icon path={iconDownload} /> : undefined
							}
						>
							{variant === "apply" ? "Apply" : "Download"}
						</Button>
					</Group>
				</Stack>
			</Stack>
		</Paper>
	);
}
