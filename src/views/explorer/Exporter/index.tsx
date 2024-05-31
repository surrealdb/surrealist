import { Button, Checkbox, Modal, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useState } from "react";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { EXPORT_TYPES, ExportType, SURQL_FILTER } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useToggleList } from "~/hooks/toggle";
import { useIntent } from "~/hooks/url";
import { createDatabaseExport } from "~/util/exporter";
import { showInfo } from "~/util/helpers";
import { iconChevronRight, iconDownload, iconUpload } from "~/util/icons";
import { Icon } from "../../../components/Icon";
import { ModalTitle } from "../../../components/ModalTitle";

export function Exporter() {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const [showExporter, setShowExporter] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportTypes, setExportTypes] = useToggleList<ExportType>([
		"tables",
		"analyzers",
		"functions",
		"params",
		"scopes",
	]);

	const openExporter = useStable(() => {
		setShowExporter(true);
	});

	const closeExporter = useStable(() => {
		setShowExporter(false);
	});

	const handleExport = useStable(async () => {
		try {
			const success = await adapter.saveFile(
				"Save database export",
				"database.surql",
				[SURQL_FILTER],
				() => {
					setIsExporting(true);

					return createDatabaseExport(exportTypes);
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
			closeExporter();
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
				size="xs"
				title={<ModalTitle>Export data</ModalTitle>}
			>
				<Text mb="xl" c={isLight ? "slate.7" : "slate.2"}>
					Select which elements you want to include in your export.
				</Text>

				<Stack>
					{EXPORT_TYPES.map((type) => (
						<Checkbox
							key={type}
							label={`Include ${type}`}
							checked={exportTypes.includes(type)}
							onChange={setExportTypes.bind(null, type)}
						/>
					))}
				</Stack>

				<Button
					mt="xl"
					fullWidth
					onClick={handleExport}
					loading={isExporting}
					disabled={exportTypes.length === 0}
					variant="gradient"
					rightSection={<Icon path={iconDownload} />}
				>
					Save export
				</Button>
			</Modal>
		</>
	);
}
