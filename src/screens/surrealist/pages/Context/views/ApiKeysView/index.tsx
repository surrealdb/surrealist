import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Collapse,
	CopyButton,
	Group,
	Image,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	TagsInput,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	brandJavaScript,
	brandPython,
	SectionTitle as Heading,
	HoverGlow,
	Icon,
	iconAPI,
	iconCheck,
	iconChevronDown,
	iconChevronRight,
	iconCopy,
	iconKey,
	iconPlus,
	iconRefresh,
	iconTrash,
	pictoKeyGradient,
} from "@surrealdb/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
	useDeleteContextApiKeyMutation,
	useMintScopedKeyMutation,
	useRotateContextApiKeyMutation,
} from "~/cloud/mutations/spectron";
import { useCloudContextApiKeysQuery } from "~/cloud/queries/contexts";
import {
	type ContextApiKey,
	SPECTRON_VERBS,
	type SpectronGrants,
	type SpectronVerb,
} from "~/types";
import { ON_FOCUS_SELECT, showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../components/ContextHero";
import { useSpectron } from "../../provider";
import type { ContextViewProps } from "../../types";
import { normalizeScopePath } from "../../utils/scope-validation";
import classes from "./style.module.scss";

type IntegrationTab = "javascript" | "python" | "api";

interface IntegrationQuickLink {
	tab: IntegrationTab;
	label: string;
	description: string;
	img?: string;
	icon?: string;
}

const INTEGRATION_QUICK_LINKS: IntegrationQuickLink[] = [
	{
		tab: "javascript",
		label: "JavaScript",
		description: "Read the JavaScript guide",
		img: brandJavaScript,
	},
	{
		tab: "python",
		label: "Python",
		description: "Read the Python guide",
		img: brandPython,
	},
	{
		tab: "api",
		label: "REST API",
		description: "Read the REST API guide",
		icon: iconAPI,
	},
];

export default function ApiKeysView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const { client, principalId } = useSpectron();
	const { data: apiKeys } = useCloudContextApiKeysQuery(organization, context.id);
	const mintKeyMutation = useMintScopedKeyMutation(organization, context.id);
	const deleteKeyMutation = useDeleteContextApiKeyMutation(organization, context.id);
	const rotateKeyMutation = useRotateContextApiKeyMutation(organization, context.id);

	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [restrictOpened, { toggle: toggleRestrict, close: closeRestrict }] = useDisclosure(false);
	const [newKeyName, setNewKeyName] = useState("");
	// Optional attenuation: per-verb scope patterns. Empty verbs are omitted so
	// the minted key inherits the principal's full grants.
	const [grantDraft, setGrantDraft] = useState<Record<SpectronVerb, string[]>>(() => {
		const seeded = {} as Record<SpectronVerb, string[]>;
		for (const verb of SPECTRON_VERBS) {
			seeded[verb] = [];
		}
		return seeded;
	});
	const [createdKey, setCreatedKey] = useState<ContextApiKey | null>(null);

	// Registered scopes power autocomplete for the per-verb grant patterns. Only
	// fetched while the create modal is open. (Shares the cache key used by the
	// Scopes and Documents views.)
	const scopesQuery = useQuery({
		queryKey: ["spectron", context.id, "scopes", "list"],
		enabled: !!client && modalOpened,
		retry: false,
		queryFn: async () => {
			if (!client) {
				throw new Error("Spectron client is not ready");
			}
			return client.scopes.list();
		},
	});

	const availableScopes = useMemo(
		() =>
			(scopesQuery.data ?? []).map((scope) => normalizeScopePath(scope.path)).filter(Boolean),
		[scopesQuery.data],
	);

	const resetCreateForm = () => {
		setNewKeyName("");
		setGrantDraft(() => {
			const seeded = {} as Record<SpectronVerb, string[]>;
			for (const verb of SPECTRON_VERBS) {
				seeded[verb] = [];
			}
			return seeded;
		});
		closeRestrict();
	};

	const handleCreateKey = async () => {
		if (!principalId) return;

		const trimmed = newKeyName.trim();
		if (!trimmed) return;

		// Build attenuating grants only from non-empty verbs. If the section is
		// collapsed or every verb is empty, omit `grants` entirely so the key
		// inherits the caller's full access.
		const grants: SpectronGrants = {};
		if (restrictOpened) {
			for (const verb of SPECTRON_VERBS) {
				const patterns = grantDraft[verb]?.filter((p) => p.trim().length > 0) ?? [];
				if (patterns.length > 0) {
					grants[verb] = patterns;
				}
			}
		}

		try {
			const result = await mintKeyMutation.mutateAsync({
				name: trimmed,
				principal_id: principalId,
				...(Object.keys(grants).length > 0 ? { grants } : {}),
			});
			setCreatedKey(result);
			resetCreateForm();
			closeModal();
		} catch (err) {
			showErrorNotification({
				title: "Failed to create API key",
				content: err,
			});
		}
	};

	const handleDismissCreatedKey = () => {
		setCreatedKey(null);
	};

	const handleRevoke = (keyId: string) => {
		deleteKeyMutation.mutate(keyId);
	};

	const handleRotate = async (keyId: string) => {
		try {
			const result = await rotateKeyMutation.mutateAsync(keyId);
			setCreatedKey(result);
			showInfo({
				title: "API key rotated",
				subtitle: "The previous secret has been revoked. Copy the new value below.",
			});
		} catch (err) {
			showErrorNotification({
				title: "Failed to rotate API key",
				content: err,
			});
		}
	};

	const integrationBasePath = `/s/${context.organization_id}/${context.id}/integration`;

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Access"
				title="API keys"
				description="These are scoped keys bound to your own principal, used to connect your SDK, REST, and MCP clients to this context. By default a key inherits your full access; you can optionally add attenuating grants to narrow what it can do. The secret is shown only once when the key is created."
				art={pictoKeyGradient}
			/>

			{createdKey?.key && (
				<Alert
					color="blue"
					variant="light"
					title="Your API key is ready"
					withCloseButton
					onClose={handleDismissCreatedKey}
					icon={<Icon path={iconKey} />}
					style={{
						borderColor: "rgba(from var(--mantine-color-blue-4) r g b / 0.15)",
					}}
				>
					<Text
						mb="xs"
						className="selectable"
					>
						Copy your API key now, you won't be able to see it again.
					</Text>
					<Group
						mt="md"
						gap="sm"
						wrap="nowrap"
					>
						<CopyButton value={createdKey.key}>
							{({ copied, copy }) => (
								<Box
									onClick={copy}
									flex={1}
								>
									<TextInput
										value={createdKey.key}
										variant="unstyled"
										className={classes.preview}
										onFocus={ON_FOCUS_SELECT}
										leftSection={
											<Icon
												path={copied ? iconCheck : iconCopy}
												c="bright"
											/>
										}
										readOnly
									/>
								</Box>
							)}
						</CopyButton>
					</Group>
				</Alert>
			)}

			{/* KEYS TABLE */}
			<Box>
				<Group
					justify="space-between"
					gap="md"
				>
					<Heading
						kicker="Credentials"
						order={2}
						description="Keys are tied to your principal. Rotate a key to roll its secret, or revoke one you no longer use."
						titleProps={{ fz: 22, mt: 4 }}
						descriptionProps={{ maw: 560 }}
					>
						Your API keys
					</Heading>
					<Button
						size="sm"
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						onClick={openModal}
					>
						Create key
					</Button>
				</Group>
				<Paper
					mt="md"
					radius="sm"
					withBorder
					style={{ overflow: "hidden" }}
				>
					<Table.ScrollContainer minWidth={500}>
						<Table
							striped
							verticalSpacing="sm"
							horizontalSpacing="md"
						>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Name</Table.Th>
									<Table.Th style={{ width: 120 }}>Actions</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{apiKeys?.map((apiKey) => (
									<Table.Tr key={apiKey.id}>
										<Table.Td>
											<Group
												gap="sm"
												wrap="nowrap"
												align="flex-start"
											>
												<ThemeIcon
													size={28}
													radius="md"
													variant="light"
													color="violet"
													mt={2}
												>
													<Icon path={iconKey} />
												</ThemeIcon>
												<Stack
													gap={6}
													miw={0}
												>
													<Text
														fw={500}
														c="bright"
														className="selectable"
													>
														{apiKey.name}
													</Text>
													<KeyGrants grants={apiKey.grants} />
												</Stack>
											</Group>
										</Table.Td>
										<Table.Td w={0}>
											<Group
												gap="xs"
												wrap="nowrap"
												justify="flex-end"
											>
												<Tooltip label="Rotate">
													<ActionIcon
														variant="subtle"
														size="sm"
														color="slate"
														aria-label={`Rotate ${apiKey.name}`}
														onClick={() => handleRotate(apiKey.id)}
														loading={
															rotateKeyMutation.isPending &&
															rotateKeyMutation.variables ===
																apiKey.id
														}
													>
														<Icon path={iconRefresh} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Revoke key">
													<ActionIcon
														variant="subtle"
														size="sm"
														color="red"
														aria-label={`Revoke ${apiKey.name}`}
														onClick={() => handleRevoke(apiKey.id)}
														loading={
															deleteKeyMutation.isPending &&
															deleteKeyMutation.variables ===
																apiKey.id
														}
													>
														<Icon path={iconTrash} />
													</ActionIcon>
												</Tooltip>
											</Group>
										</Table.Td>
									</Table.Tr>
								))}
								{apiKeys?.length === 0 && (
									<Table.Tr>
										<Table.Td colSpan={3}>
											<Stack
												gap="xs"
												align="center"
												py="xl"
											>
												<Text
													fw={600}
													c="bright"
												>
													No API keys yet
												</Text>
												<Text
													fz="sm"
													className="selectable"
												>
													Create your first key to connect your SDK, REST,
													or MCP client.
												</Text>
												<Button
													mt="sm"
													size="sm"
													leftSection={<Icon path={iconPlus} />}
													onClick={openModal}
												>
													Create API key
												</Button>
											</Stack>
										</Table.Td>
									</Table.Tr>
								)}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				</Paper>
			</Box>

			{/* QUICK START */}
			<Box>
				<Heading
					kicker="Quick start"
					order={2}
					mb="sm"
					titleProps={{ fz: 22, mt: 4 }}
				>
					Authenticate with Spectron
				</Heading>
				<SimpleGrid
					cols={{ base: 1, sm: 3 }}
					spacing="md"
				>
					{INTEGRATION_QUICK_LINKS.map((item) => (
						<Link
							key={item.tab}
							href={`${integrationBasePath}?tab=${item.tab}`}
							className={classes.integrationLink}
						>
							<HoverGlow h="100%">
								<Paper
									p="md"
									radius="md"
									className={classes.integrationCard}
									h="100%"
								>
									<Group
										wrap="nowrap"
										align="center"
										h="100%"
									>
										{item.img ? (
											<Image
												src={item.img}
												w={28}
												h={28}
												alt=""
												style={{ flexShrink: 0 }}
											/>
										) : (
											<ThemeIcon
												size={32}
												radius="sm"
												variant="light"
											>
												<Icon
													path={item.icon ?? iconAPI}
													size="lg"
												/>
											</ThemeIcon>
										)}
										<Box flex={1}>
											<Text
												fw={600}
												c="bright"
											>
												{item.label}
											</Text>
											<Text c="var(--mantine-color-text)">
												{item.description}
											</Text>
										</Box>
										<Icon
											path={iconChevronRight}
											c="slate"
											ml="md"
										/>
									</Group>
								</Paper>
							</HoverGlow>
						</Link>
					))}
				</SimpleGrid>
			</Box>

			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title={<Text fw={600}>Create API key</Text>}
			>
				<Stack gap="md">
					<Text
						fz="sm"
						className="selectable"
					>
						This mints a scoped key bound to your principal. Give it a name so you can
						identify it later. You will see the secret value only once.
					</Text>
					<TextInput
						label="Name"
						placeholder="e.g. Production key"
						value={newKeyName}
						error={
							apiKeys?.some((it) => it.name === newKeyName)
								? "A key with this name already exists"
								: undefined
						}
						onChange={(e) => setNewKeyName(e.currentTarget.value)}
					/>

					{/* OPTIONAL ATTENUATING GRANTS */}
					<Box>
						<Button
							size="compact-sm"
							variant="subtle"
							color="slate"
							px={0}
							onClick={toggleRestrict}
							rightSection={
								<Icon
									path={iconChevronDown}
									style={{
										transition: "transform 0.15s ease",
										transform: restrictOpened ? "rotate(180deg)" : undefined,
									}}
								/>
							}
						>
							Restrict this key's access (optional)
						</Button>
						<Collapse expanded={restrictOpened}>
							<Stack
								gap="sm"
								mt="sm"
							>
								<Text
									fz="xs"
									c="slate"
								>
									A scoped key can only narrow (attenuate) your own access, it can
									never grant more than you already have. Leave a verb empty to
									inherit your full access for it.
								</Text>
								{SPECTRON_VERBS.map((verb) => (
									<Group
										key={verb}
										align="flex-start"
										wrap="nowrap"
										gap="sm"
									>
										<Text
											fz="sm"
											ff="monospace"
											w={110}
											mt={6}
											style={{ flexShrink: 0 }}
										>
											{verb}
										</Text>
										<TagsInput
											flex={1}
											placeholder="Add scope pattern…"
											data={availableScopes}
											value={grantDraft[verb]}
											onChange={(value) =>
												setGrantDraft((prev) => ({
													...prev,
													[verb]: value,
												}))
											}
											clearable
										/>
									</Group>
								))}
							</Stack>
						</Collapse>
					</Box>

					{!principalId && (
						<Text
							fz="xs"
							c="slate"
						>
							Connecting… your principal is required to mint a key.
						</Text>
					)}

					<Group justify="flex-end">
						<Button onClick={closeModal}>Cancel</Button>
						<Button
							variant="gradient"
							onClick={handleCreateKey}
							disabled={
								!principalId ||
								!newKeyName.trim() ||
								apiKeys?.some((it) => it.name === newKeyName)
							}
							loading={mintKeyMutation.isPending}
						>
							Create key
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}

/**
 * Renders a key's attenuating grants as a per-verb scope-pattern summary. Empty
 * or absent grants mean the key inherits the principal's full access.
 */
function KeyGrants({ grants }: { grants?: SpectronGrants }) {
	const summary = SPECTRON_VERBS.map((verb) => ({
		verb,
		patterns: grants?.[verb] ?? [],
	})).filter((entry) => entry.patterns.length > 0);

	if (summary.length === 0) {
		return (
			<Text
				fz="xs"
				c="slate"
			>
				Inherits your full access
			</Text>
		);
	}

	return (
		<Stack gap={4}>
			{summary.map(({ verb, patterns }) => (
				<Group
					key={verb}
					gap={6}
					wrap="nowrap"
					align="center"
				>
					<Badge
						variant="light"
						color="violet"
						size="sm"
						tt="none"
						ff="monospace"
						style={{ flexShrink: 0 }}
					>
						{verb}
					</Badge>
					<Text
						fz="xs"
						c="slate"
						ff="monospace"
						className="selectable"
						style={{ wordBreak: "break-all" }}
					>
						{patterns.join("  ·  ")}
					</Text>
				</Group>
			))}
		</Stack>
	);
}
