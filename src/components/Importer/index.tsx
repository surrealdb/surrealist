import { Button, Group, Modal, Paper } from "@mantine/core";
import { SURQL_FILTERS } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { mdiFileDocument, mdiUpload } from "@mdi/js";
import { adapter } from "~/adapter";
import { showNotification } from "@mantine/notifications";
import { showError } from "~/util/helpers";
import { ModalTitle } from "../ModalTitle";
import { useDisclosure } from "@mantine/hooks";
import { Spacer } from "../Spacer";
import { Text } from "@mantine/core";
import { fetchDatabaseSchema } from "~/util/schema";
import { getActiveSurreal } from "~/util/connection";
import { OpenedFile } from "~/adapter/base";

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
				px="xs"
				color={isLight ? "light.0" : "dark.4"}
				title="Import database from file"
				onClick={startImport}
				loading={isImporting}
				disabled={!isOnline}
			>
				<Icon path={mdiUpload} color={isOnline ? (isLight ? "light.8" : "white") : undefined} />
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
					bg={isLight ? "light.1" : "dark.5"}
				>
					<Group
						spacing={6}
						position="center"
						noWrap
					>
						<Icon
							mt={-1}
							path={mdiFileDocument}
							color={isLight ? "light.9" : "light.0"}
						/>
						<Text
							truncate
							c={isLight ? "light.9" : "light.0"}
							weight={600}
						>
							{importFile.current?.name}
						</Text>
					</Group>
				</Paper>

				<Text
					mb="xl"
					color={isLight ? "light.7" : "light.3"}
				>
					Are you sure you want to import the selected file?
				</Text>

				<Text
					mb="xl"
					color={isLight ? "light.7" : "light.3"}
				>
					While existing data will be preserved, it may be overwritten by the imported data.
				</Text>

				<Group>
					<Button
						variant="light"
						color={isLight ? "light.5" : "light.3"}
						onClick={showConfirmHandle.close}
					>
						Close
					</Button>
					<Spacer />
					<Button
						onClick={confirmImport}
						loading={isImporting}
					>
						Import
						<Icon path={mdiUpload} right />
					</Button>
				</Group>
			</Modal>
		</>
	);
}