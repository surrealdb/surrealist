import { Box, Button, Checkbox, Modal, Paper, SimpleGrid, Stack } from "@mantine/core";
import { EXPORT_TYPES, ExportType, SURQL_FILTER } from "~/constants";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { Text } from "@mantine/core";
import { useToggleList } from "~/hooks/toggle";
import { adapter } from "~/adapter";
import { createDatabaseExport } from "~/util/exporter";
import { iconChevronRight, iconDownload, iconUpload } from "~/util/icons";
import { showInfo, slugify } from "~/util/helpers";
import { Entry } from "~/components/Entry";
import { useIntent } from "~/hooks/url";
import { useTableNames } from "~/hooks/schema";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import dayjs from "dayjs";

export function Exporter() {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const tables = useTableNames();
	const connection = useActiveConnection();

	const [showExporter, setShowExporter] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportTypes, setExportTypes] = useToggleList<ExportType>(['tables', 'analyzers', 'functions', 'params', 'scopes']);
	const [records, setRecord, setRecords] = useToggleList<string>([]);
	const [comments, commentsHandle] = useDisclosure(true);

	const openExporter = useStable(() => {
		setShowExporter(true);
	});

	const closeExporter = useStable(() => {
		setShowExporter(false);
	});

	const fileName = `${slugify(connection.name)}-${dayjs().format('YYYY-MM-DD')}.surql`;

	const handleExport = useStable(async () => {
		try {
			const success = await adapter.saveFile(
				'Save database export',
				fileName,
				[SURQL_FILTER],
				() => {
					setIsExporting(true);

					return createDatabaseExport({
						types: exportTypes,
						records,
						comments,
					});
				}
			);

			if (success) {
				showInfo({
					title: "Export",
					subtitle: "Database export saved to disk",
				});
			}
		} finally {
			setIsExporting(false);
			closeExporter();
		}
	});

	const toggleAllRecords = useStable(() => {
		if (records.length === tables.length) {
			setRecords([]);
		} else {
			setRecords(tables);
		}
	});

	useIntent("export-database", openExporter);

	return (
		<>
			<Entry
				leftSection={<Icon path={iconUpload} />}
				rightSection={<Icon path={iconChevronRight} />}
				onClick={openExporter}
				loading={isExporting}
				disabled={!isOnline}
				style={{ flexShrink: 0 }}
				bg="transparent"
			>
				Export data
			</Entry>

			<Modal
				opened={showExporter}
				onClose={closeExporter}
				size="sm"
				title={<ModalTitle>Export data</ModalTitle>}
			>
				<Stack gap="xl">
					<Text c={isLight ? "slate.7" : "slate.2"}>
						Select which elements you want to include in your export.
					</Text>

					<Stack>
						<Text c="bright" fw={600} fz="lg">
							Options
						</Text>

						<Checkbox
							label="Include comments"
							checked={comments}
							onChange={commentsHandle.toggle}
						/>
					</Stack>

					<Stack>
						<Text c="bright" fw={600} fz="lg">
							Definitions
						</Text>

						<SimpleGrid cols={2}>
							{EXPORT_TYPES.map((type) => (
								<Checkbox
									key={type}
									label={`Include ${type}`}
									checked={exportTypes.includes(type)}
									onChange={setExportTypes.bind(null, type)}
								/>
							))}
						</SimpleGrid>
					</Stack>

					{tables.length > 0 && (
						<Stack>
							<Text c="bright" fw={600} fz="lg">
								Records
							</Text>
							<Box>
								<Paper
									bg="slate.9"
									radius="md"
									p="sm"
								>
									<Checkbox
										label="Include all records"
										checked={records.length === tables.length}
										onChange={toggleAllRecords}
										indeterminate={records.length > 0 && records.length < tables.length}
										size="xs"
									/>
									<Stack gap="sm" mt="xl">
										{tables.map((table) => (
											<Checkbox
												key={table}
												label={table}
												checked={records.includes(table)}
												onChange={setRecord.bind(null, table)}
												size="xs"
											/>
										))}
									</Stack>
								</Paper>
							</Box>
						</Stack>
					)}

					<Button
						fullWidth
						onClick={handleExport}
						loading={isExporting}
						disabled={exportTypes.length === 0}
						variant="gradient"
						rightSection={<Icon path={iconDownload} />}
					>
						Save export
					</Button>
				</Stack>
			</Modal>
		</>
	);
}