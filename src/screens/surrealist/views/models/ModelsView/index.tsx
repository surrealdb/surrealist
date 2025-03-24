import { Button, Group, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { ML_SUPPORTED } from "~/constants";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { useViewFocus } from "~/hooks/routing";
import { useSaveable } from "~/hooks/save";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { composeHttpConnection } from "~/screens/surrealist/connection/connection";
import type { SchemaModel } from "~/types";
import { tagEvent } from "~/util/analytics";
import { createBaseAuthentication } from "~/util/defaults";
import { connectionUri } from "~/util/helpers";
import { iconModuleML, iconOpen, iconUpload, iconWarning } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { EditorPanel } from "../EditorPanel";
import { ModelsPanel } from "../ModelsPanel";

const SURML_FILTERS = [
	{
		name: "SurrealML Model",
		extensions: ["surml", "surrealml"],
	},
];

export function ModelsView() {
	const models = useDatabaseSchema()?.models ?? [];
	const isConnected = useIsConnected();

	const [id, namespace, database, authentication] = useConnection((c) => [
		c?.id ?? "",
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication ?? createBaseAuthentication(),
	]);

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

	const uploadModel = useRequireDatabase(async () => {
		const files = await adapter.openBinaryFile("Select a SurrealML model", SURML_FILTERS, true);
		const { endpoint, headers } = composeHttpConnection(
			authentication,
			namespace,
			database,
			"/ml/import",
			{
				Accept: "application/json",
			},
		);

		for (const file of files) {
			await fetch(endpoint, {
				method: "POST",
				headers,
				body: file.content,
			});

			tagEvent("import", { extension: "surml" });
		}

		syncConnectionSchema();
	});

	const downloadModel = useStable(async (model: SchemaModel) => {
		// TODO Replace with version field when definition work properly
		const [, name, version] = /^(\w+)<(.+)>$/.exec(model.name) || [];

		const { endpoint, headers } = composeHttpConnection(
			authentication,
			namespace,
			database,
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

		tagEvent("export", { extension: "surml" });
	});

	const snippet = useMemo(
		() => ({
			title: "Using Python",
			language: "python",
			code: `
			# Upload your model directly to SurrealDB
			SurMlFile.upload(
				path="./model.surml",
				url="${isAvailable ? connectionUri(authentication, "ml/import") : "http://surrealdb.example.com/ml/import"}",
				chunk_size=36864,
				namespace="${namespace}",
				database="${database}",
				username="...",
				password="..."
			)							
		`,
		}),
		[authentication, namespace, database, isAvailable],
	);

	useViewFocus("models", () => {
		syncConnectionSchema();
	});

	return (
		<Group
			h="100%"
			wrap="nowrap"
			gap="var(--surrealist-divider-size)"
		>
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
				<Introduction
					title="Models"
					icon={iconModuleML}
					snippet={snippet}
				>
					<Text>
						Upload your SurrealML models directly to SurrealDB and use the power of
						Machine Learning within your queries.
					</Text>
					{!isAvailable && (
						<Group
							gap="sm"
							c="pink"
						>
							<Icon path={iconWarning} />
							<Text>
								SurrealML is not supported{" "}
								{isSandbox ? "in the sandbox" : "by your current connection"}
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
							onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealml")}
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
