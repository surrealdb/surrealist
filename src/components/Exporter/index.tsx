import { Button, Checkbox, Modal, Stack } from "@mantine/core";
import { EXPORT_TYPES, ExportType, SURQL_FILTERS } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { Icon } from "../Icon";
import { mdiDownload } from "@mdi/js";
import { ModalTitle } from "../ModalTitle";
import { Text } from "@mantine/core";
import { useToggleList } from "~/hooks/toggle";
import { adapter } from "~/adapter";
import { showNotification } from "@mantine/notifications";
import { createDatabaseExport } from "~/util/exporter";

export function Exporter() {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const [showExporter, setShowExporter] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportTypes, setExportTypes] = useToggleList<ExportType>(['tables', 'analyzers', 'functions', 'params', 'scopes']);

	const openExporter = useStable(() => {
		setShowExporter(true);
	});

	const closeExporter = useStable(() => {
		setShowExporter(false);
	});

	const handleExport = useStable(async () => {
		try {
			const success = await adapter.saveFile(
				'Save database export',
				'database.surql',
				SURQL_FILTERS,
				() => {
					setIsExporting(true);
					
					return createDatabaseExport(exportTypes);
				}
			);
	
			if (success) {
				showNotification({
					message: "Database export saved to disk",
				});
			}
		} finally {
			setIsExporting(false);
			closeExporter();
		}
	});

	return (
		<>
			<Button
				px="xs"
				color={isLight ? "light.0" : "dark.4"}
				title="Export database to file"
				onClick={openExporter}
				disabled={!isOnline}
			>
				<Icon path={mdiDownload} color={isOnline ? (isLight ? "light.8" : "white") : undefined} />
			</Button>

			<Modal
				opened={showExporter}
				onClose={closeExporter}
				size="xs"
				title={<ModalTitle>Export database</ModalTitle>}
			>
				<Text
					mb="xl"
					color={isLight ? "light.7" : "light.3"}
				>
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
				>
					Save export
					<Icon path={mdiDownload} right />
				</Button>
			</Modal>
		</>
	);
}