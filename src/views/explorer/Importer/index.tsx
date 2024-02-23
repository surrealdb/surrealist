import { Button, Group, Modal, Paper } from "@mantine/core";
import { SURQL_FILTERS } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useRef, useState } from "react";
import { Icon } from "../../../components/Icon";
import { adapter } from "~/adapter";
import { showNotification } from "@mantine/notifications";
import { showError } from "~/util/helpers";
import { ModalTitle } from "../../../components/ModalTitle";
import { useDisclosure } from "@mantine/hooks";
import { Text } from "@mantine/core";
import { fetchDatabaseSchema } from "~/util/schema";
import { getActiveSurreal } from "~/util/surreal";
import { OpenedFile } from "~/adapter/base";
import { iconDownload, iconFile, iconUpload } from "~/util/icons";

export function Importer() {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const [showConfirm, showConfirmHandle] = useDisclosure();
	const [isImporting, setIsImporting] = useState(false);

	const importFile = useRef<OpenedFile | null>(null);

	const startImport = useStable(async () => {
		try {
			const [file] = await adapter.openFile(
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

			await getActiveSurreal().query(importFile.current!.content);

			showNotification({
				title: 'Import successful',
				message: 'The database was successfully imported',
			});

			fetchDatabaseSchema();
		} catch(err: any) {
			console.error(err);

			showError("Import failed", "There was an error importing the database");
		} finally {
			setIsImporting(false);
			showConfirmHandle.close();
		}
	});

	return (
		<>
			<Button
				fullWidth
				color="slate"
				variant="light"
				leftSection={<Icon path={iconDownload} />}
				onClick={startImport}
				loading={isImporting}
				disabled={!isOnline}
			>
				Import database
			</Button>
			
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
					<Icon path={iconUpload} right />
				</Button>
			</Modal>
		</>
	);
}