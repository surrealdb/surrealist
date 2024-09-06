import { python } from "@codemirror/lang-python";
import { Button, Group, Stack, Text } from "@mantine/core";
import posthog from "posthog-js";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { ML_SUPPORTED } from "~/constants";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useSaveable } from "~/hooks/save";
import { useSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useViewEffect } from "~/hooks/view";
import type { Authentication, SchemaModel } from "~/types";
import { connectionUri } from "~/util/helpers";
import { iconModuleML, iconOpen, iconUpload, iconWarning } from "~/util/icons";
import { syncDatabaseSchema } from "~/util/schema";
import { EditorPanel } from "../EditorPanel";
import { ModelsPanel } from "../ModelsPanel";

const SURML_FILTERS = [
	{
		name: "SurrealML Model",
		extensions: ["surml", "surrealml"],
	},
];

function composeConnection(connection: Authentication, path: string) {
	const isSecure =
		connection.protocol === "https" || connection.protocol === "wss";
	const endpoint = new URL(
		path,
		`${isSecure ? "https" : "http"}://${connection.hostname}`,
	).toString();

	const auth = btoa(`${connection.username}:${connection.password}`);
	const headers = {
		Accept: "application/json",
		Authorization: `Basic ${auth}`,
		"surreal-ns": connection.namespace,
		"surreal-db": connection.database,
	};

	return { endpoint, headers };
}

export function ModelsView() {
	const models = useSchema()?.models ?? [];
	const { id, authentication } = useActiveConnection();
	const isConnected = useIsConnected();

	const [details, setDetails] = useImmer<SchemaModel | null>(null);
	const isAvailable = ML_SUPPORTED.has(authentication.protocol);
	const isSandbox = id === "sandbox";

	const handle = useSaveable({
		track: {
			details,
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
		const files = await adapter.openBinaryFile(
			"Select a SurrealML model",
			SURML_FILTERS,
			true,
		);
		const { endpoint, headers } = composeConnection(
			authentication,
			"/ml/import",
		);

		for (const file of files) {
			await fetch(endpoint, {
				method: "POST",
				headers,
				body: file.content,
			});
		}

		syncDatabaseSchema();

		posthog.capture("model_import");
	});

	const downloadModel = useStable(async (model: SchemaModel) => {
		// TODO Replace with version field when definition work properly
		const [, name, version] = /^(\w+)<(.+)>$/.exec(model.name) || [];

		const { endpoint, headers } = composeConnection(
			authentication,
			`/ml/export/${name}/${version}`,
		);

		await adapter.saveFile(
			"Save SurrealML model",
			`${name}-${version}.surml`,
			SURML_FILTERS,
			() =>
				fetch(endpoint, {
					method: "GET",
					headers,
				}).then((res) => res.blob()),
		);
	});

	useViewEffect("models", () => {
		syncDatabaseSchema();
	});

	return (
		<Group h="100%" wrap="nowrap" gap="var(--surrealist-divider-size)">
			{isAvailable && (
				<ModelsPanel
					active={details?.name || ""}
					models={models}
					onSelect={editModel}
					onDownload={downloadModel}
					onUpload={uploadModel}
				/>
			)}
			{details ? (
				<Stack h="100%" flex={1} gap="var(--surrealist-divider-size)">
					<EditorPanel
						handle={handle}
						details={details}
						onChange={setDetails as any}
					/>
				</Stack>
			) : (
				<Introduction
					title="Models"
					icon={iconModuleML}
					snippet={
						isAvailable
							? {
									title: "Using Python",
									extensions: [python()],
									code: `
							# Upload your model directly to SurrealDB
							SurMlFile.upload(
								path="./model.surml",
								url="${connectionUri(authentication, "ml/import")}",
								chunk_size=36864,
								namespace="${authentication.namespace}",
								database="${authentication.database}",
								username="...",
								password="..."
							)							
						`,
								}
							: undefined
					}
				>
					<Text>
						Upload your SurrealML models directly to SurrealDB and
						use the power of Machine Learning within your queries.
					</Text>
					{!isAvailable && (
						<Group gap="sm" c="pink">
							<Icon path={iconWarning} />
							<Text>
								SurrealML is not supported{" "}
								{isSandbox
									? "in the sandbox"
									: "by your current connection"}
							</Text>
						</Group>
					)}
					<Group>
						{isAvailable && (
							<Button
								flex={1}
								variant="gradient"
								leftSection={<Icon path={iconUpload} />}
								disabled={!isConnected}
								onClick={uploadModel}
							>
								Upload model
							</Button>
						)}
						<Button
							flex={1}
							color="slate"
							variant="light"
							rightSection={<Icon path={iconOpen} />}
							onClick={() =>
								adapter.openUrl(
									"https://surrealdb.com/docs/surrealml",
								)
							}
						>
							Learn more
						</Button>
					</Group>
				</Introduction>
			)}
		</Group>
	);
}

export default ModelsView;
