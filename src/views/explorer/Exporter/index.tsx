import { Button, Checkbox, Modal, Stack } from "@mantine/core";
import { EXPORT_TYPES, ExportType, SURQL_FILTERS } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { Icon } from "../../../components/Icon";
import { ModalTitle } from "../../../components/ModalTitle";
import { Text } from "@mantine/core";
import { useToggleList } from "~/hooks/toggle";
import { adapter } from "~/adapter";
import { showNotification } from "@mantine/notifications";
import { createDatabaseExport } from "~/util/exporter";
import { iconDownload, iconUpload } from "~/util/icons";

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
				fullWidth
				color="slate"
				variant="light"
				leftSection={<Icon path={iconUpload} />}
				onClick={openExporter}
				loading={isExporting}
				disabled={!isOnline}
			>
				Export database
			</Button>

			<Modal
				opened={showExporter}
				onClose={closeExporter}
				size="xs"
				title={<ModalTitle>Export database</ModalTitle>}
			>
				<Text
					mb="xl"
					c={isLight ? "slate.7" : "slate.2"}
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
					variant="gradient"
					rightSection={<Icon path={iconDownload} />}
				>
					Save export
				</Button>
			</Modal>
		</>
	);
}