import { Box, Button, Checkbox, Modal, Paper, SimpleGrid, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState } from "react";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { EXPORT_TYPES, type ExportType, SURQL_FILTER } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useActiveConnection } from "~/hooks/connection";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useToggleList } from "~/hooks/toggle";
import { useIntent } from "~/hooks/url";
import { createDatabaseExport } from "~/util/exporter";
import { showInfo, slugify } from "~/util/helpers";
import { iconDownload } from "~/util/icons";

export function DataExportModal() {
	const isLight = useIsLight();
	const tables = useTableNames();
	const connection = useActiveConnection();

	const [isOpen, openedHandle] = useBoolean();

	const [isExporting, setIsExporting] = useState(false);
	const [records, setRecord, setRecords] = useToggleList<string>([]);
	const [comments, commentsHandle] = useDisclosure(true);
	const [exportTypes, setExportTypes] = useToggleList<ExportType>([
		"tables",
		"analyzers",
		"functions",
		"params",
		"scopes",
	]);

	const fileName = `${slugify(connection.name)}-${dayjs().format("YYYY-MM-DD")}.surql`;

	const handleExport = useStable(async () => {
		try {
			const success = await adapter.saveFile(
				"Save database export",
				fileName,
				[SURQL_FILTER],
				() => {
					setIsExporting(true);

					return createDatabaseExport({
						types: exportTypes,
						records,
						comments,
					});
				},
			);

			if (success) {
				showInfo({
					title: "Export",
					subtitle: "Database export saved to disk",
				});
			}
		} finally {
			setIsExporting(false);
			openedHandle.close();
		}
	});

	const toggleAllRecords = useStable(() => {
		if (records.length === tables.length) {
			setRecords([]);
		} else {
			setRecords(tables);
		}
	});

	useIntent("export-database", openedHandle.open);

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			size="sm"
			title={<PrimaryTitle>Export data</PrimaryTitle>}
		>
			<Stack gap="xl">
				<Text>
					Select which schema resources and table records you want to include in your
					export.
				</Text>

				<Stack>
					<Text
						c="bright"
						fw={600}
						fz="lg"
					>
						Options
					</Text>

					<Checkbox
						label="Include comments"
						checked={comments}
						onChange={commentsHandle.toggle}
					/>
				</Stack>

				<Stack>
					<Text
						c="bright"
						fw={600}
						fz="lg"
					>
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
						<Text
							c="bright"
							fw={600}
							fz="lg"
						>
							Records
						</Text>
						<Box>
							<Paper
								bg={isLight ? "slate.0" : "slate.9"}
								radius="md"
								p="sm"
							>
								<Checkbox
									label="Include all records"
									checked={records.length === tables.length}
									onChange={toggleAllRecords}
									indeterminate={
										records.length > 0 && records.length < tables.length
									}
									size="xs"
								/>
								<Stack
									gap="sm"
									mt="xl"
								>
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
	);
}
