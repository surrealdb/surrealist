import {
	Badge,
	Box,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Switch,
	Text,
	ThemeIcon,
} from "@mantine/core";
import {
	Icon,
	iconClock,
	iconCog,
	iconList,
	iconTune,
	pictoCapabilitesGradient,
	SectionTitle,
} from "@surrealdb/ui";
import {
	useCloudContextConfigQuery,
	useCloudContextProvidersQuery,
} from "~/cloud/queries/contexts";
import { ContextHero } from "../../../components/ContextHero";
import { EmptyState, PageError } from "../../../components/feedback";
import type { ContextViewProps } from "../../../types";

// The Cloud config surface is READ-ONLY: it exposes a summary of how the
// context is provisioned but has no editable per-stage model assignment or
// label dimensions. This tab therefore only ever displays these fields.

const BOOLEAN_SETTINGS: {
	key: "reject_unbound_keys" | "llm_extraction_enabled" | "pii_redaction_enabled";
	label: string;
	description: string;
}[] = [
	{
		key: "llm_extraction_enabled",
		label: "LLM extraction",
		description: "Use an LLM to extract entities and relations from ingested content.",
	},
	{
		key: "pii_redaction_enabled",
		label: "PII redaction",
		description: "Detect and redact personally identifiable information before storage.",
	},
	{
		key: "reject_unbound_keys",
		label: "Reject unbound keys",
		description: "Refuse API keys that are not bound to an explicit principal.",
	},
];

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

export function ConfigurationTab({ context }: ContextViewProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const configQuery = useCloudContextConfigQuery(org, ctxId);
	const providersQuery = useCloudContextProvidersQuery(org, ctxId);

	const config = configQuery.data;
	const providers = providersQuery.data ?? [];

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title="Configuration"
				description="A read-only summary of the models, providers, and ingestion behaviour provisioned for this context's memory pipeline."
				art={pictoCapabilitesGradient}
			/>

			{/* CONFIGURATION */}
			<Box>
				<SectionTitle
					kicker="Pipeline"
					order={2}
					mb="md"
					description="How content is processed as it enters this context. These values are managed by your plan and can't be edited here."
				>
					Configuration
				</SectionTitle>

				{configQuery.isError ? (
					<PageError
						title="Couldn't load configuration"
						message={errorMessage(configQuery.error)}
						onRetry={() => configQuery.refetch()}
					/>
				) : (
					<Paper
						p="lg"
						radius="md"
						withBorder
					>
						{configQuery.isPending ? (
							<Skeleton
								h={200}
								radius="md"
							/>
						) : !config ? (
							<Text
								fz="sm"
								c="slate"
							>
								No configuration is available for this context.
							</Text>
						) : (
							<Stack gap="lg">
								<SimpleGrid
									cols={{ base: 1, sm: 2 }}
									spacing="md"
								>
									{config.token_limit !== undefined && (
										<ReadValue
											icon={iconTune}
											label="Token limit"
											value={
												config.token_limit != null
													? `${config.token_limit.toLocaleString()} tokens`
													: "Unlimited"
											}
										/>
									)}
									{config.billing_anchor_day != null && (
										<ReadValue
											icon={iconClock}
											label="Billing anchor"
											value={`Day ${config.billing_anchor_day} of the month`}
										/>
									)}
									{config.ingestion_profile != null && (
										<ReadValue
											icon={iconCog}
											label="Ingestion profile"
											value={config.ingestion_profile}
										/>
									)}
								</SimpleGrid>

								<Stack gap="md">
									{BOOLEAN_SETTINGS.map((setting) => (
										<Switch
											key={setting.key}
											label={setting.label}
											description={setting.description}
											checked={config[setting.key] ?? false}
											readOnly
											disabled
										/>
									))}
								</Stack>

								<Box>
									<Text
										fz="xs"
										c="slate"
										mb="xs"
									>
										Providers with credentials
									</Text>
									{config.providers_configured &&
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
								</Box>
							</Stack>
						)}
					</Paper>
				)}
			</Box>

			{/* AVAILABLE MODELS */}
			<Box>
				<SectionTitle
					kicker="Models"
					order={2}
					mb="md"
					description="The models selectable for each provider configured on this context."
				>
					Available models
				</SectionTitle>

				{providersQuery.isError ? (
					<PageError
						title="Couldn't load the provider catalogue"
						message={errorMessage(providersQuery.error)}
						onRetry={() => providersQuery.refetch()}
					/>
				) : providersQuery.isPending ? (
					<Skeleton
						h={120}
						radius="md"
					/>
				) : providers.length === 0 ? (
					<EmptyState
						icon={iconList}
						title="No available models"
						description="This context has no model providers available yet."
					/>
				) : (
					<Stack gap="md">
						{providers.map((provider) => (
							<Paper
								key={provider.provider}
								p="lg"
								radius="md"
								withBorder
							>
								<Group
									gap="sm"
									wrap="nowrap"
									mb="sm"
								>
									<ThemeIcon
										size={32}
										radius="md"
										variant="light"
										color="violet"
									>
										<Icon path={iconCog} />
									</ThemeIcon>
									<Text
										fw={600}
										c="bright"
										tt="capitalize"
									>
										{provider.provider}
									</Text>
								</Group>
								{provider.models.length > 0 ? (
									<Group gap="xs">
										{provider.models.map((model) => (
											<Badge
												key={model}
												variant="default"
												tt="none"
											>
												{model}
											</Badge>
										))}
									</Group>
								) : (
									<Text
										fz="sm"
										c="slate"
									>
										No models listed for this provider.
									</Text>
								)}
							</Paper>
						))}
					</Stack>
				)}
			</Box>
		</Stack>
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
