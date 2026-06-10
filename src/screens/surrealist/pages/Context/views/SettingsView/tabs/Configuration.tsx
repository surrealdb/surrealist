import {
	Badge,
	Box,
	Button,
	Group,
	Paper,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Switch,
	Text,
	ThemeIcon,
} from "@mantine/core";
import {
	Icon,
	iconCheck,
	iconCog,
	iconList,
	iconTune,
	pictoCapabilites,
	SectionTitle,
	useStable,
} from "@surrealdb/ui";
import { useEffect, useState } from "react";
import { usePatchContextConfigMutation } from "~/cloud/mutations/spectron";
import {
	useCloudContextConfigQuery,
	useCloudContextProvidersQuery,
} from "~/cloud/queries/contexts";
import type {
	SpectronContextConfig,
	SpectronContextModels,
	SpectronModelProvider,
	SpectronProviderModels,
	SpectronStageModel,
} from "~/types";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../../components/ContextHero";
import { EmptyState, PageError } from "../../../components/feedback";
import type { ContextViewProps } from "../../../types";

type LlmStage = "extraction" | "reconciliation" | "synthesis" | "elaboration_consolidation";

const LLM_STAGES: { key: LlmStage; label: string; description: string }[] = [
	{
		key: "extraction",
		label: "Extraction",
		description: "Pulls entities, attributes, and relations out of new content.",
	},
	{
		key: "reconciliation",
		label: "Reconciliation",
		description: "Merges newly observed facts into the existing memory graph.",
	},
	{
		key: "synthesis",
		label: "Synthesis",
		description: "Composes grounded answers during retrieval.",
	},
	{
		key: "elaboration_consolidation",
		label: "Elaboration & consolidation",
		description: "Background reflection that strengthens and prunes memory.",
	},
];

/** A single editable stage row: provider Select + model Select. */
type StageDraft = SpectronStageModel | null;

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

export function ConfigurationTab({ context }: ContextViewProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const configQuery = useCloudContextConfigQuery(org, ctxId);
	const providersQuery = useCloudContextProvidersQuery(org, ctxId);
	const patchMutation = usePatchContextConfigMutation(org, ctxId);

	const config = configQuery.data;
	const providers = providersQuery.data?.providers ?? [];

	// Local, editable copy of the per-stage model assignments.
	const [stageDrafts, setStageDrafts] = useState<Record<LlmStage, StageDraft>>({
		extraction: null,
		reconciliation: null,
		synthesis: null,
		elaboration_consolidation: null,
	});
	const [embeddingDraft, setEmbeddingDraft] = useState<string | null>(null);

	// Re-seed local state whenever the server config changes.
	useEffect(() => {
		const models = config?.models;
		setStageDrafts({
			extraction: models?.extraction ?? null,
			reconciliation: models?.reconciliation ?? null,
			synthesis: models?.synthesis ?? null,
			elaboration_consolidation: models?.elaboration_consolidation ?? null,
		});
		setEmbeddingDraft(models?.embedding ?? null);
	}, [config?.models]);

	const setStageProvider = useStable((stage: LlmStage, provider: string | null) => {
		setStageDrafts((prev) => {
			if (!provider) {
				return { ...prev, [stage]: null };
			}

			const typed = provider as SpectronModelProvider;
			const current = prev[stage];
			// Keep the model only if it still belongs to the chosen provider.
			const keepModel =
				current && current.provider === typed
					? current.model
					: (providers.find((p) => p.provider === typed)?.models?.[0] ?? "");

			return { ...prev, [stage]: { provider: typed, model: keepModel } };
		});
	});

	const setStageModel = useStable((stage: LlmStage, model: string | null) => {
		setStageDrafts((prev) => {
			const current = prev[stage];
			if (!current) return prev;
			return { ...prev, [stage]: { ...current, model: model ?? "" } };
		});
	});

	const handleSaveModels = useStable(async () => {
		const models: SpectronContextModels = {};

		for (const { key } of LLM_STAGES) {
			const draft = stageDrafts[key];
			// Only send fully-specified stages.
			if (draft?.provider && draft.model) {
				models[key] = { provider: draft.provider, model: draft.model };
			}
		}

		if (embeddingDraft) {
			models.embedding = embeddingDraft;
		}

		try {
			await patchMutation.mutateAsync({ models });
			showInfo({
				title: "Models updated",
				subtitle: "The model assignment for this context has been saved.",
			});
		} catch (err) {
			// The Cloud config-write path is uncertain; keep the user's selections.
			showErrorNotification({
				title: "Couldn't save models",
				content: errorMessage(err),
			});
		}
	});

	const handleToggle = useStable(
		async (field: "llm_extraction_enabled" | "pii_redaction_enabled", value: boolean) => {
			try {
				await patchMutation.mutateAsync({
					[field]: value,
				} as Partial<SpectronContextConfig>);
				showInfo({
					title: "Setting updated",
					subtitle: "Your context configuration has been saved.",
				});
			} catch (err) {
				showErrorNotification({
					title: "Couldn't save setting",
					content: errorMessage(err),
				});
			}
		},
	);

	const dirtyModels = (() => {
		const m = config?.models;
		const stageChanged = LLM_STAGES.some(({ key }) => {
			const a = stageDrafts[key];
			const b = m?.[key] ?? null;
			return (
				(a?.provider ?? null) !== (b?.provider ?? null) ||
				(a?.model ?? null) !== (b?.model ?? null)
			);
		});
		return stageChanged || (embeddingDraft ?? null) !== (m?.embedding ?? null);
	})();

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title="Configuration"
				description="Control the models, providers, and ingestion behaviour powering this context's memory pipeline."
				art={pictoCapabilites}
			/>

			{configQuery.isError ? (
				<PageError
					title="Couldn't load configuration"
					message={errorMessage(configQuery.error)}
					onRetry={() => configQuery.refetch()}
				/>
			) : (
				<>
					{/* MODEL ASSIGNMENT */}
					<Box>
						<Group
							justify="space-between"
							align="flex-end"
							mb="md"
						>
							<SectionTitle
								kicker="Models"
								order={2}
								description="Pick the provider and model that backs each stage of the pipeline."
							>
								Model assignment
							</SectionTitle>
							<Button
								size="sm"
								variant="gradient"
								leftSection={<Icon path={iconCheck} />}
								disabled={!dirtyModels}
								loading={patchMutation.isPending}
								onClick={handleSaveModels}
							>
								Save models
							</Button>
						</Group>

						<Paper
							p="lg"
							radius="md"
							withBorder
						>
							{configQuery.isPending || providersQuery.isPending ? (
								<Stack gap="lg">
									{LLM_STAGES.map((s) => (
										<Skeleton
											key={s.key}
											h={64}
											radius="md"
										/>
									))}
								</Stack>
							) : (
								<Stack gap="lg">
									{LLM_STAGES.map((stage) => (
										<StageRow
											key={stage.key}
											label={stage.label}
											description={stage.description}
											providers={providers}
											value={stageDrafts[stage.key]}
											onProviderChange={(p) => setStageProvider(stage.key, p)}
											onModelChange={(m) => setStageModel(stage.key, m)}
										/>
									))}

									<EmbeddingRow
										providers={providers}
										value={embeddingDraft}
										onChange={setEmbeddingDraft}
									/>

									{providersQuery.isError && (
										<Text
											fz="xs"
											c="orange"
										>
											Couldn't load the provider catalogue; model lists may be
											incomplete.
										</Text>
									)}
								</Stack>
							)}
						</Paper>
					</Box>

					{/* PIPELINE BEHAVIOUR */}
					<Box>
						<SectionTitle
							kicker="Pipeline"
							order={2}
							mb="md"
							description="How content is processed as it enters this context."
						>
							Ingestion & processing
						</SectionTitle>
						<Paper
							p="lg"
							radius="md"
							withBorder
						>
							{configQuery.isPending ? (
								<Skeleton
									h={140}
									radius="md"
								/>
							) : (
								<Stack gap="lg">
									<SimpleGrid
										cols={{ base: 1, sm: 2 }}
										spacing="md"
									>
										<ReadValue
											icon={iconTune}
											label="Token limit"
											value={
												config?.token_limit != null
													? config.token_limit.toLocaleString()
													: "Unlimited"
											}
										/>
										<ReadValue
											icon={iconCog}
											label="Ingestion profile"
											value={config?.ingestion_profile ?? "Default"}
										/>
									</SimpleGrid>

									<Switch
										label="LLM extraction"
										description="Use an LLM to extract entities and relations from ingested content."
										checked={config?.llm_extraction_enabled ?? false}
										disabled={patchMutation.isPending}
										onChange={(e) =>
											handleToggle(
												"llm_extraction_enabled",
												e.currentTarget.checked,
											)
										}
									/>
									<Switch
										label="PII redaction"
										description="Detect and redact personally identifiable information before storage."
										checked={config?.pii_redaction_enabled ?? false}
										disabled={patchMutation.isPending}
										onChange={(e) =>
											handleToggle(
												"pii_redaction_enabled",
												e.currentTarget.checked,
											)
										}
									/>
								</Stack>
							)}
						</Paper>
					</Box>

					{/* PROVIDERS */}
					<Box>
						<SectionTitle
							kicker="Providers"
							order={2}
							mb="md"
							description="Model providers that have credentials configured for this context."
						>
							Configured providers
						</SectionTitle>
						<Paper
							p="lg"
							radius="md"
							withBorder
						>
							{configQuery.isPending ? (
								<Skeleton
									h={32}
									w={240}
									radius="md"
								/>
							) : config?.providers_configured &&
								config.providers_configured.length > 0 ? (
								<Group gap="xs">
									{config.providers_configured.map((p) => (
										<Badge
											key={p}
											size="lg"
											variant="light"
											color="violet"
											tt="none"
										>
											{p}
										</Badge>
									))}
								</Group>
							) : (
								<Text
									fz="sm"
									c="slate"
								>
									No providers have credentials configured yet.
								</Text>
							)}
						</Paper>
					</Box>

					{/* LABEL DIMENSIONS */}
					<Box>
						<SectionTitle
							kicker="Labels"
							order={2}
							mb="md"
							description="Dimensions available for labelling memories and documents."
						>
							Label dimensions
						</SectionTitle>
						{configQuery.isPending ? (
							<Skeleton
								h={96}
								radius="md"
							/>
						) : config?.label_dimensions && config.label_dimensions.length > 0 ? (
							<Paper
								radius="md"
								withBorder
								style={{ overflow: "hidden" }}
							>
								<Stack gap={0}>
									{config.label_dimensions.map((dim, idx) => (
										<Group
											key={dim.key ?? idx}
											justify="space-between"
											px="lg"
											py="sm"
											wrap="nowrap"
											style={{
												borderTop:
													idx === 0
														? undefined
														: "1px solid var(--mantine-color-default-border)",
											}}
										>
											<Group
												gap="sm"
												wrap="nowrap"
											>
												<ThemeIcon
													size={28}
													radius="md"
													variant="light"
													color="violet"
												>
													<Icon path={iconList} />
												</ThemeIcon>
												<Box>
													<Text
														fw={500}
														c="bright"
														className="selectable"
													>
														{dim.key}
													</Text>
													{dim.description && (
														<Text
															fz="xs"
															c="slate"
														>
															{dim.description}
														</Text>
													)}
												</Box>
											</Group>
											<Badge
												variant="light"
												color={
													dim.value_policy === "closed"
														? "orange"
														: "slate"
												}
												tt="none"
											>
												{dim.value_policy ?? "open"}
											</Badge>
										</Group>
									))}
								</Stack>
							</Paper>
						) : (
							<EmptyState
								icon={iconList}
								title="No label dimensions"
								description="This context has no custom label dimensions defined."
							/>
						)}
					</Box>
				</>
			)}
		</Stack>
	);
}

interface StageRowProps {
	label: string;
	description: string;
	providers: SpectronProviderModels[];
	value: StageDraft;
	onProviderChange: (provider: string | null) => void;
	onModelChange: (model: string | null) => void;
}

function StageRow({
	label,
	description,
	providers,
	value,
	onProviderChange,
	onModelChange,
}: StageRowProps) {
	const providerOptions = providers.map((p) => ({ value: p.provider, label: p.provider }));
	const modelOptions =
		providers
			.find((p) => p.provider === value?.provider)
			?.models?.map((m) => ({
				value: m,
				label: m,
			})) ?? [];

	return (
		<Box>
			<Text
				fw={600}
				c="bright"
				fz="sm"
			>
				{label}
			</Text>
			<Text
				fz="xs"
				c="slate"
				mb="xs"
			>
				{description}
			</Text>
			<Group
				grow
				align="flex-start"
				wrap="wrap"
			>
				<Select
					label="Provider"
					placeholder="Select provider"
					data={providerOptions}
					value={value?.provider ?? null}
					onChange={onProviderChange}
					clearable
					searchable
				/>
				<Select
					label="Model"
					placeholder={value?.provider ? "Select model" : "Pick a provider first"}
					data={modelOptions}
					value={value?.model || null}
					onChange={onModelChange}
					disabled={!value?.provider}
					searchable
				/>
			</Group>
		</Box>
	);
}

interface EmbeddingRowProps {
	providers: SpectronProviderModels[];
	value: string | null;
	onChange: (model: string | null) => void;
}

function EmbeddingRow({ providers, value, onChange }: EmbeddingRowProps) {
	// Embedding is a single model string; flatten every provider's models.
	const modelOptions = providers.flatMap((p) =>
		(p.models ?? []).map((m) => ({ value: m, label: m, group: p.provider })),
	);

	// Surface a value that isn't in the catalogue so it still displays.
	const data =
		value && !modelOptions.some((o) => o.value === value)
			? [...modelOptions, { value, label: value, group: "Current" }]
			: modelOptions;

	return (
		<Box>
			<Text
				fw={600}
				c="bright"
				fz="sm"
			>
				Embedding
			</Text>
			<Text
				fz="xs"
				c="slate"
				mb="xs"
			>
				The model used to vectorise memories and documents for retrieval.
			</Text>
			<Select
				label="Model"
				placeholder="Select embedding model"
				data={data}
				value={value}
				onChange={onChange}
				clearable
				searchable
				maw={{ base: "100%", sm: "50%" }}
			/>
		</Box>
	);
}

interface ReadValueProps {
	icon: string;
	label: string;
	value: string;
}

function ReadValue({ icon, label, value }: ReadValueProps) {
	return (
		<Group
			gap="sm"
			wrap="nowrap"
		>
			<ThemeIcon
				size={36}
				radius="md"
				variant="light"
				color="violet"
			>
				<Icon path={icon} />
			</ThemeIcon>
			<Box>
				<Text
					fz="xs"
					c="slate"
				>
					{label}
				</Text>
				<Text
					fw={600}
					c="bright"
					className="selectable"
				>
					{value}
				</Text>
			</Box>
		</Group>
	);
}
