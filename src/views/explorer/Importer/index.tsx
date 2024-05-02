import { Button, Group, Modal, Paper } from "@mantine/core";
import { SURQL_FILTERS } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useRef, useState } from "react";
import { Icon } from "../../../components/Icon";
import { adapter } from "~/adapter";
import { showError, showInfo } from "~/util/helpers";
import { ModalTitle } from "../../../components/ModalTitle";
import { useDisclosure } from "@mantine/hooks";
import { Text } from "@mantine/core";
import { syncDatabaseSchema } from "~/util/schema";
import { OpenedTextFile } from "~/adapter/base";
import { iconChevronRight, iconDownload, iconFile } from "~/util/icons";
import { Entry } from "~/components/Entry";
import { useIntent } from "~/hooks/url";
import { executeQuery } from "~/connection";

export function Importer() {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const [showConfirm, showConfirmHandle] = useDisclosure();
	const [isImporting, setIsImporting] = useState(false);

	const importFile = useRef<OpenedTextFile | null>(null);

	const startImport = useStable(async () => {
		try {
			const [file] = await adapter.openTextFile(
				'Import query file',
				SURQL_FILTERS,
				false
			);

			if (!file) {
				return;
			}

			importFile.current = file;
			showConfirmHandle.open();
		} finally {
			setIsImporting(false);
		}
	});

	const confirmImport = useStable(async () => {
		try {
			setIsImporting(true);

			await executeQuery(importFile.current!.content);

			showInfo({
				title: "Importer",
				subtitle: "Database was successfully imported"
			});

			await syncDatabaseSchema();
		} catch(err: any) {
			console.error(err);

			showError({
				title: "Import failed",
				subtitle: "There was an error importing the database"
			});
		} finally {
			setIsImporting(false);
			showConfirmHandle.close();
		}
	});

	useIntent("import-database", startImport);

	return (
		<>
			<Entry
				leftSection={<Icon path={iconDownload} />}
				rightSection={<Icon path={iconChevronRight} />}
				onClick={startImport}
				loading={isImporting}
				disabled={!isOnline}
				style={{ flexShrink: 0 }}
				bg="transparent"
			>
				Import database
			</Entry>

			<Modal
				opened={showConfirm}
				onClose={showConfirmHandle.close}
				size="sm"
				title={<ModalTitle>Import database</ModalTitle>}
			>
				<Paper
					p="sm"
					mb="md"
					radius="md"
					bg={isLight ? "slate.1" : "slate.7"}
				>
					<Group
						gap={6}
						justify="center"
						wrap="nowrap"
					>
						<Icon
							mt={-1}
							path={iconFile}
						/>
						<Text
							truncate
							c={isLight ? "black" : "white"}
							fw={600}
						>
							{importFile.current?.name}
						</Text>
					</Group>
				</Paper>

				<Text
					mb="xl"
					c={isLight ? "slate.7" : "slate.2"}
				>
					Are you sure you want to import the selected file?
				</Text>

				<Text
					mb="xl"
					c={isLight ? "slate.7" : "slate.2"}
				>
					While existing data will be preserved, it may be overwritten by the imported data.
				</Text>

				<Button
					mt="xl"
					fullWidth
					onClick={confirmImport}
					loading={isImporting}
					variant="gradient"
				>
					Start import
					<Icon path={iconDownload} right />
				</Button>
			</Modal>
		</>
	);
}