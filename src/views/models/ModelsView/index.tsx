import { Button, Center, Group, Stack, Text } from "@mantine/core";
import { ModelsPanel } from "../ModelsPanel";
import { EditorPanel } from "../EditorPanel";
import { Icon } from "~/components/Icon";
import { mdiBrain } from "@mdi/js";
import { iconUpload } from "~/util/icons";
import { useStable } from "~/hooks/stable";
import { adapter } from "~/adapter";
import { useActiveConnection } from "~/hooks/connection";
import { useImmer } from "use-immer";
import { useSchema } from "~/hooks/schema";
import { useSaveable } from "~/hooks/save";
import { ConnectionOptions, ModelDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";

const SURML_FILTERS = [
	{
		name: "SurrealML Model",
		extensions: ["surml", "surrealml"],
	},
];

function composeConnection(connection: ConnectionOptions, path: string) {
	const isSecure = connection.protocol === "https" || connection.protocol === "wss";
	const endpoint = new URL(path, `${isSecure ? "https" : "http"}://${connection.hostname}`).toString();

	const auth = btoa(`${connection.username}:${connection.password}`);
	const headers = {
		'Accept': 'application/json',
		'Authorization': `Basic ${auth}`,
		'surreal-ns': connection.namespace,
		'surreal-db': connection.database,
	};

	return { endpoint, headers };
}

export function ModelsView() {
	const models = useSchema()?.models ?? [];
	const { connection } = useActiveConnection();

	const [details, setDetails] = useImmer<ModelDefinition | null>(null);

	const handle = useSaveable({
		track: {
			details
		},
		onSave(original) {
			//
		},
		onRevert({ details }) {
			setDetails(details);
		},
	});

	const editModel = useStable((name: string) => {
		// setDetails(models.find((m) => m.name === name) || null);
		// handle.track();
	});

	const uploadModel = useStable(async () => {
		const files = await adapter.openBinaryFile("Select a SurrealML model", SURML_FILTERS, true);
		const { endpoint, headers } = composeConnection(connection, '/ml/import');

		for (const file of files) {
			await fetch(endpoint, {
				method: "POST",
				headers,
				body: file.content
			});
		}

		fetchDatabaseSchema();
	});

	const downloadModel = useStable(async (model: ModelDefinition) => {
		// TODO Replace with version field when definition work properly
		const [, name, version] = /^(\w+)<(.+)>$/.exec(model.name) || [];

		const { endpoint, headers } = composeConnection(connection, `/ml/export/${name}/${version}`);

		await adapter.saveFile(
			"Save SurrealML model",
			`${name}-${version}.surml`,
			SURML_FILTERS,
			() => fetch(endpoint, {
				method: "GET",
				headers
			}).then(res => res.blob())
		);
	});

	return (
		<Group
			h="100%"
			wrap="nowrap"
			gap="var(--surrealist-divider-size)"
		>
			<ModelsPanel
				active={details?.name || ''}
				models={models}
				onSelect={editModel}
				onDownload={downloadModel}
				onUpload={uploadModel}
			/>
			{details ? (
				<Stack
					h="100%"
					flex={1}
					gap="var(--surrealist-divider-size)"
				>
					<EditorPanel
						handle={handle}
						details={details}
						onChange={setDetails as any}
					/>
				</Stack>
			) : (
				<Center flex={1}>
					<Stack
						align="center"
						justify="center"
					>
						<Icon path={mdiBrain} size={2.5} />
						<Text maw={250} ta="center">
							Press the button to upload a new SurrealML model to this database
						</Text>
						<Group>
							<Button
								variant="light"
								leftSection={<Icon path={iconUpload} />}
								onClick={uploadModel}
							>
								Upload SurrealML model
							</Button>
						</Group>
					</Stack>
				</Center>
			)}
		</Group>
	);
}
