import {
	ActionIcon,
	Alert,
	Avatar,
	Badge,
	Box,
	Button,
	Collapse,
	CopyButton,
	Divider,
	Group,
	Modal,
	NumberInput,
	Paper,
	SegmentedControl,
	Select,
	Skeleton,
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
	Icon,
	iconAccount,
	iconAccountPlus,
	iconCheck,
	iconChevronDown,
	iconCopy,
	iconHelp,
	iconKey,
	iconMemory,
	iconPlus,
	iconRefresh,
	iconServer,
	iconTrash,
	pictoFingerPrints,
	SectionTitle,
	useStable,
} from "@surrealdb/ui";
import { useMemo, useState } from "react";
import {
	useAddContextUserMutation,
	useCreatePrincipalMutation,
	useDeleteContextApiKeyMutation,
	useDeletePrincipalMutation,
	useMintScopedKeyMutation,
	useReplacePrincipalGrantsMutation,
	useRotateContextApiKeyMutation,
	useUpdatePrincipalMutation,
} from "~/cloud/mutations/spectron";
import {
	useCloudContextApiKeysQuery,
	useCloudContextPrincipalsQuery,
} from "~/cloud/queries/contexts";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { useConfirmation } from "~/providers/Confirmation";
import {
	type ContextApiKey,
	SPECTRON_VERBS,
	type SpectronGrants,
	type SpectronPrincipal,
	type SpectronPrincipalKind,
	type SpectronVerb,
} from "~/types";
import { ON_FOCUS_SELECT, showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../../components/ContextHero";
import { EmptyState, PageError } from "../../../components/feedback";
import type { ContextViewProps } from "../../../types";
import classes from "../style.module.scss";

// ─── Static metadata ───

const VERB_HINTS: Record<SpectronVerb, string> = {
	read: "Retrieve memories and documents within matching scopes.",
	write: "Add or update memories and documents within matching scopes.",
	create_scope: "Create new child scopes beneath matching scopes.",
	delete_scope: "Tombstone (remove) matching scopes.",
	grant: "Delegate a subset of these grants to other principals.",
	manage: "Administer principals, keys, and configuration for matching scopes.",
	forget: "Permanently erase memories within matching scopes.",
};

const KIND_META: Record<
	SpectronPrincipalKind,
	{ label: string; plural: string; icon: string; color: string }
> = {
	human: { label: "Member", plural: "Members", icon: iconAccount, color: "violet" },
	agent: { label: "Agent", plural: "Agents", icon: iconMemory, color: "blue" },
	service: { label: "Service", plural: "Services", icon: iconServer, color: "teal" },
	unknown: { label: "Unknown", plural: "Unknown", icon: iconHelp, color: "slate" },
};

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

/** Best-effort read of a recorded owner principal id from loosely-typed metadata. */
function readOwner(principal: SpectronPrincipal): string | undefined {
	const meta = principal.metadata;
	if (meta && typeof meta === "object" && "owner" in meta) {
		const owner = (meta as Record<string, unknown>).owner;
		return typeof owner === "string" ? owner : undefined;
	}
	return undefined;
}

/** Best-effort read of a linked Cloud user id from loosely-typed metadata. */
function readLinkedUser(principal: SpectronPrincipal): string | undefined {
	const meta = principal.metadata;
	if (meta && typeof meta === "object") {
		const record = meta as Record<string, unknown>;
		for (const key of ["user_id", "userId", "cloud_user_id"]) {
			const value = record[key];
			if (typeof value === "string") return value;
		}
	}
	return undefined;
}

// ─── Main tab ───

export function PrincipalsTab({ context }: ContextViewProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const principalsQuery = useCloudContextPrincipalsQuery(org, ctxId);
	const principals = useMemo(() => principalsQuery.data ?? [], [principalsQuery.data]);

	const grouped = useMemo(() => {
		const buckets: Record<SpectronPrincipalKind, SpectronPrincipal[]> = {
			human: [],
			agent: [],
			service: [],
			unknown: [],
		};
		for (const principal of principals) {
			const kind = principal.kind ?? "unknown";
			(buckets[kind] ?? buckets.unknown).push(principal);
		}
		return buckets;
	}, [principals]);

	// Lookup of principal id -> display name, used to label owners.
	const principalNames = useMemo(() => {
		const map = new Map<string, string>();
		for (const p of principals) {
			map.set(p.id, p.display_name || p.id);
		}
		return map;
	}, [principals]);

	const [addMemberOpened, addMemberHandlers] = useDisclosure(false);
	const [createOpened, createHandlers] = useDisclosure(false);
	const [createKind, setCreateKind] = useState<SpectronPrincipalKind>("agent");

	const [oneTimeKey, setOneTimeKey] = useState<ContextApiKey | null>(null);

	const openCreate = (kind: SpectronPrincipalKind) => {
		setCreateKind(kind);
		createHandlers.open();
	};

	const renderError = principalsQuery.isError ? (
		<PageError
			title="Couldn't load principals"
			message={errorMessage(principalsQuery.error)}
			onRetry={() => principalsQuery.refetch()}
		/>
	) : null;

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title="Principals"
				description="Members, agents, and services that can act inside this context — and the scoped grants and keys that bound what they can do."
				art={pictoFingerPrints}
			/>

			{oneTimeKey?.key && (
				<OneTimeKeyAlert
					apiKey={oneTimeKey}
					onClose={() => setOneTimeKey(null)}
				/>
			)}

			{renderError}

			{/* MEMBERS */}
			<PrincipalSection
				kind="human"
				principals={grouped.human}
				loading={principalsQuery.isPending}
				principalNames={principalNames}
				context={context}
				onKeyMinted={setOneTimeKey}
				action={
					<Button
						size="sm"
						variant="light"
						leftSection={<Icon path={iconAccountPlus} />}
						onClick={addMemberHandlers.open}
					>
						Add member
					</Button>
				}
			/>

			{/* AGENTS */}
			<PrincipalSection
				kind="agent"
				principals={grouped.agent}
				loading={principalsQuery.isPending}
				principalNames={principalNames}
				context={context}
				onKeyMinted={setOneTimeKey}
				action={
					<Button
						size="sm"
						variant="light"
						leftSection={<Icon path={iconPlus} />}
						onClick={() => openCreate("agent")}
					>
						Create agent
					</Button>
				}
			/>

			{/* SERVICES */}
			<PrincipalSection
				kind="service"
				principals={grouped.service}
				loading={principalsQuery.isPending}
				principalNames={principalNames}
				context={context}
				onKeyMinted={setOneTimeKey}
				action={
					<Button
						size="sm"
						variant="light"
						leftSection={<Icon path={iconPlus} />}
						onClick={() => openCreate("service")}
					>
						Create service
					</Button>
				}
			/>

			{/* UNKNOWN (only if present) */}
			{grouped.unknown.length > 0 && (
				<PrincipalSection
					kind="unknown"
					principals={grouped.unknown}
					loading={false}
					principalNames={principalNames}
					context={context}
					onKeyMinted={setOneTimeKey}
				/>
			)}

			{/* CONTEXT API KEYS */}
			<ContextApiKeysSection
				context={context}
				onKeyMinted={setOneTimeKey}
			/>

			<AddMemberModal
				context={context}
				principals={principals}
				opened={addMemberOpened}
				onClose={addMemberHandlers.close}
			/>

			<CreatePrincipalModal
				context={context}
				principals={principals}
				kind={createKind}
				setKind={setCreateKind}
				opened={createOpened}
				onClose={createHandlers.close}
			/>
		</Stack>
	);
}

// ─── A kind-grouped section ───

interface PrincipalSectionProps {
	kind: SpectronPrincipalKind;
	principals: SpectronPrincipal[];
	loading: boolean;
	principalNames: Map<string, string>;
	context: ContextViewProps["context"];
	onKeyMinted: (key: ContextApiKey) => void;
	action?: React.ReactNode;
}

function PrincipalSection({
	kind,
	principals,
	loading,
	principalNames,
	context,
	onKeyMinted,
	action,
}: PrincipalSectionProps) {
	const meta = KIND_META[kind];

	// Order so that owned agents follow their owner where an owner is recorded.
	const ordered = useMemo(() => {
		if (kind !== "agent") return principals;
		const withoutOwner = principals.filter((p) => !readOwner(p));
		const byOwner = new Map<string, SpectronPrincipal[]>();
		for (const p of principals) {
			const owner = readOwner(p);
			if (owner) {
				const list = byOwner.get(owner) ?? [];
				list.push(p);
				byOwner.set(owner, list);
			}
		}
		// Standalone agents first, then grouped-by-owner clusters.
		const clustered = [...byOwner.values()].flat();
		return [...withoutOwner, ...clustered];
	}, [principals, kind]);

	return (
		<Box>
			<Group
				justify="space-between"
				align="flex-end"
				mb="md"
			>
				<SectionTitle
					kicker="Principals"
					order={2}
				>
					{meta.plural}
				</SectionTitle>
				{action}
			</Group>

			{loading ? (
				<Stack gap="sm">
					<Skeleton
						h={64}
						radius="md"
					/>
					<Skeleton
						h={64}
						radius="md"
					/>
				</Stack>
			) : ordered.length === 0 ? (
				<EmptyState
					icon={meta.icon}
					title={`No ${meta.plural.toLowerCase()} yet`}
					description={
						kind === "human"
							? "Add an organization member to give them access to this context."
							: `Create a ${meta.label.toLowerCase()} to let it act within this context.`
					}
				/>
			) : (
				<Stack gap="sm">
					{ordered.map((principal) => {
						const ownerId = readOwner(principal);
						const ownerName = ownerId ? principalNames.get(ownerId) : undefined;
						return (
							<PrincipalRow
								key={principal.id}
								principal={principal}
								ownerName={ownerName}
								context={context}
								onKeyMinted={onKeyMinted}
							/>
						);
					})}
				</Stack>
			)}
		</Box>
	);
}

// ─── A single expandable principal ───

interface PrincipalRowProps {
	principal: SpectronPrincipal;
	ownerName?: string;
	context: ContextViewProps["context"];
	onKeyMinted: (key: ContextApiKey) => void;
}

function PrincipalRow({ principal, ownerName, context, onKeyMinted }: PrincipalRowProps) {
	const org = context.organization_id;
	const ctxId = context.id;
	const meta = KIND_META[principal.kind] ?? KIND_META.unknown;

	const [opened, { toggle }] = useDisclosure(false);
	const [mintOpened, mintHandlers] = useDisclosure(false);
	const [editingName, setEditingName] = useState(false);
	const [nameDraft, setNameDraft] = useState(principal.display_name ?? "");
	const [kindDraft, setKindDraft] = useState<SpectronPrincipalKind>(principal.kind ?? "unknown");

	const updateMutation = useUpdatePrincipalMutation(org, ctxId);
	const deleteMutation = useDeletePrincipalMutation(org, ctxId);
	const grantsMutation = useReplacePrincipalGrantsMutation(org, ctxId);

	const linkedUser = readLinkedUser(principal);

	const grantBadges = useMemo(() => {
		const entries: { verb: SpectronVerb; count: number }[] = [];
		for (const verb of SPECTRON_VERBS) {
			const patterns = principal.grants?.[verb];
			if (patterns && patterns.length > 0) {
				entries.push({ verb, count: patterns.length });
			}
		}
		return entries;
	}, [principal.grants]);

	const confirmDelete = useConfirmation({
		title: "Delete principal",
		message: (
			<Text>
				This permanently removes{" "}
				<Text
					span
					c="bright"
				>
					{principal.display_name || principal.id}
				</Text>{" "}
				and revokes its access to this context. This cannot be undone.
			</Text>
		),
		confirmText: "Delete",
		confirmProps: { color: "red" },
		onConfirm: async () => {
			try {
				await deleteMutation.mutateAsync(principal.id);
				showInfo({
					title: "Principal deleted",
					subtitle: `${principal.display_name || principal.id} has been removed.`,
				});
			} catch (err) {
				showErrorNotification({
					title: "Couldn't delete principal",
					content: errorMessage(err),
				});
			}
		},
	});

	const handleSaveIdentity = useStable(async () => {
		try {
			await updateMutation.mutateAsync({
				principalId: principal.id,
				body: {
					display_name: nameDraft.trim() || undefined,
					kind: kindDraft !== principal.kind ? kindDraft : undefined,
				},
			});
			setEditingName(false);
			showInfo({
				title: "Principal updated",
				subtitle: "The principal details have been saved.",
			});
		} catch (err) {
			showErrorNotification({
				title: "Couldn't update principal",
				content: errorMessage(err),
			});
		}
	});

	const handleSaveGrants = useStable(async (grants: SpectronGrants) => {
		try {
			await grantsMutation.mutateAsync({ principalId: principal.id, grants });
			showInfo({
				title: "Grants updated",
				subtitle: "Scope grants for this principal have been replaced.",
			});
		} catch (err) {
			showErrorNotification({
				title: "Couldn't save grants",
				content: errorMessage(err),
			});
		}
	});

	return (
		<Paper
			withBorder
			radius="md"
			className={`${classes.principalRow} ${ownerName ? classes.nestedPrincipal : ""}`}
		>
			{/* HEADER */}
			<Group
				justify="space-between"
				p="md"
				wrap="nowrap"
				onClick={toggle}
				style={{ cursor: "pointer" }}
			>
				<Group
					gap="sm"
					wrap="nowrap"
					flex={1}
					miw={0}
				>
					<ThemeIcon
						size={36}
						radius="md"
						variant="light"
						color={meta.color}
					>
						<Icon path={meta.icon} />
					</ThemeIcon>
					<Box miw={0}>
						<Group
							gap="xs"
							wrap="nowrap"
						>
							<Text
								fw={600}
								c="bright"
								truncate
							>
								{principal.display_name || "Unnamed principal"}
							</Text>
							<Badge
								size="xs"
								variant="light"
								color={meta.color}
								tt="none"
							>
								{meta.label}
							</Badge>
						</Group>
						<Text
							fz="xs"
							c="slate"
							truncate
						>
							{ownerName ? `Owned by ${ownerName} · ` : ""}
							{linkedUser ? `Linked user ${linkedUser} · ` : ""}
							{grantBadges.length} grant{grantBadges.length === 1 ? "" : "s"}
						</Text>
					</Box>
				</Group>
				<Icon
					path={iconChevronDown}
					c="slate"
					style={{
						transition: "transform 0.15s ease",
						transform: opened ? "rotate(180deg)" : undefined,
					}}
				/>
			</Group>

			<Collapse expanded={opened}>
				<Divider />
				<Stack
					gap="lg"
					p="md"
				>
					{/* IDENTITY */}
					<Box>
						<Group
							justify="space-between"
							mb="xs"
						>
							<Text
								fw={600}
								fz="sm"
								c="bright"
							>
								Identity
							</Text>
							{!editingName && (
								<Button
									size="compact-xs"
									variant="subtle"
									onClick={() => {
										setNameDraft(principal.display_name ?? "");
										setKindDraft(principal.kind ?? "unknown");
										setEditingName(true);
									}}
								>
									Edit
								</Button>
							)}
						</Group>
						{editingName ? (
							<Group
								align="flex-end"
								wrap="wrap"
							>
								<TextInput
									label="Display name"
									value={nameDraft}
									onChange={(e) => setNameDraft(e.currentTarget.value)}
									flex={1}
									miw={180}
								/>
								<Select
									label="Kind"
									data={[
										{ value: "human", label: "Member" },
										{ value: "agent", label: "Agent" },
										{ value: "service", label: "Service" },
									]}
									value={kindDraft}
									onChange={(v) =>
										setKindDraft((v as SpectronPrincipalKind) ?? kindDraft)
									}
									w={140}
								/>
								<Button
									variant="gradient"
									loading={updateMutation.isPending}
									disabled={!nameDraft.trim()}
									onClick={handleSaveIdentity}
								>
									Save
								</Button>
								<Button
									variant="subtle"
									color="slate"
									onClick={() => setEditingName(false)}
								>
									Cancel
								</Button>
							</Group>
						) : (
							<Group gap="md">
								<KeyValue
									label="ID"
									value={principal.id}
									copyable
								/>
								<KeyValue
									label="Kind"
									value={meta.label}
								/>
							</Group>
						)}
					</Box>

					<Divider />

					{/* GRANTS */}
					<GrantsEditor
						grants={principal.grants ?? {}}
						saving={grantsMutation.isPending}
						onSave={handleSaveGrants}
					/>

					<Divider />

					{/* KEYS */}
					<Box>
						<Group
							justify="space-between"
							mb="xs"
						>
							<Box>
								<Text
									fw={600}
									fz="sm"
									c="bright"
								>
									Keys
								</Text>
								<Text
									fz="xs"
									c="slate"
								>
									Mint a scoped API key bound to this principal.
								</Text>
							</Box>
							<Button
								size="compact-sm"
								variant="light"
								leftSection={<Icon path={iconKey} />}
								onClick={mintHandlers.open}
							>
								Mint key
							</Button>
						</Group>
					</Box>

					<Divider />

					{/* DANGER */}
					<Group justify="flex-end">
						<Button
							size="compact-sm"
							variant="subtle"
							color="red"
							leftSection={<Icon path={iconTrash} />}
							onClick={() => confirmDelete()}
						>
							Delete principal
						</Button>
					</Group>
				</Stack>
			</Collapse>

			<MintKeyModal
				context={context}
				principal={principal}
				opened={mintOpened}
				onClose={mintHandlers.close}
				onKeyMinted={onKeyMinted}
			/>
		</Paper>
	);
}

// ─── Grants editor ───

interface GrantsEditorProps {
	grants: SpectronGrants;
	saving: boolean;
	onSave: (grants: SpectronGrants) => void;
}

function GrantsEditor({ grants, saving, onSave }: GrantsEditorProps) {
	// Local draft keyed by verb. Seeded from the principal's current grants.
	const [draft, setDraft] = useState<Record<SpectronVerb, string[]>>(() => {
		const seeded = {} as Record<SpectronVerb, string[]>;
		for (const verb of SPECTRON_VERBS) {
			seeded[verb] = grants[verb] ?? [];
		}
		return seeded;
	});

	const activeBadges = SPECTRON_VERBS.filter((verb) => (grants[verb]?.length ?? 0) > 0);

	const handleSave = useStable(() => {
		const result: SpectronGrants = {};
		for (const verb of SPECTRON_VERBS) {
			const patterns = draft[verb]?.filter((p) => p.trim().length > 0) ?? [];
			if (patterns.length > 0) {
				result[verb] = patterns;
			}
		}
		onSave(result);
	});

	return (
		<Box>
			<Group
				justify="space-between"
				mb="xs"
			>
				<Box>
					<Text
						fw={600}
						fz="sm"
						c="bright"
					>
						Scope grants
					</Text>
					<Text
						fz="xs"
						c="slate"
					>
						Each verb takes scope patterns like{" "}
						<Text
							span
							ff="monospace"
							fz="xs"
						>
							org/apple/*
						</Text>{" "}
						or{" "}
						<Text
							span
							ff="monospace"
							fz="xs"
						>
							/
						</Text>{" "}
						(the whole context).
					</Text>
				</Box>
				<Button
					size="compact-sm"
					variant="gradient"
					leftSection={<Icon path={iconCheck} />}
					loading={saving}
					onClick={handleSave}
				>
					Save grants
				</Button>
			</Group>

			{activeBadges.length > 0 ? (
				<Group
					gap="xs"
					mb="md"
				>
					{activeBadges.map((verb) => (
						<Badge
							key={verb}
							variant="light"
							color="violet"
							tt="none"
						>
							{verb} · {grants[verb]?.length}
						</Badge>
					))}
				</Group>
			) : (
				<Text
					fz="xs"
					c="slate"
					mb="md"
				>
					No grants yet — this principal can't access any scope.
				</Text>
			)}

			<Stack gap="sm">
				{SPECTRON_VERBS.map((verb) => (
					<Group
						key={verb}
						align="flex-start"
						wrap="nowrap"
						gap="sm"
					>
						<Tooltip
							label={VERB_HINTS[verb]}
							multiline
							w={260}
							withArrow
						>
							<Badge
								variant="default"
								tt="none"
								w={120}
								style={{ flexShrink: 0, cursor: "help" }}
							>
								{verb}
							</Badge>
						</Tooltip>
						<TagsInput
							flex={1}
							placeholder="Add scope pattern…"
							value={draft[verb]}
							onChange={(value) => setDraft((prev) => ({ ...prev, [verb]: value }))}
							clearable
						/>
					</Group>
				))}
			</Stack>
		</Box>
	);
}

// ─── Context API keys (context-wide) ───

interface ContextApiKeysSectionProps {
	context: ContextViewProps["context"];
	onKeyMinted: (key: ContextApiKey) => void;
}

function ContextApiKeysSection({ context, onKeyMinted }: ContextApiKeysSectionProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const keysQuery = useCloudContextApiKeysQuery(org, ctxId);
	const deleteMutation = useDeleteContextApiKeyMutation(org, ctxId);
	const rotateMutation = useRotateContextApiKeyMutation(org, ctxId);

	const keys = keysQuery.data ?? [];
	const [rotatingId, setRotatingId] = useState<string | null>(null);

	const confirmRevoke = useConfirmation<ContextApiKey>({
		title: "Revoke API key",
		message: (key) => (
			<Text>
				Revoke{" "}
				<Text
					span
					c="bright"
				>
					{key?.name ?? "this key"}
				</Text>
				? Any client using it will immediately lose access.
			</Text>
		),
		confirmText: "Revoke",
		confirmProps: { color: "red" },
		onConfirm: async (key) => {
			try {
				await deleteMutation.mutateAsync(key.id);
				showInfo({ title: "Key revoked", subtitle: `${key.name} has been revoked.` });
			} catch (err) {
				showErrorNotification({
					title: "Couldn't revoke key",
					content: errorMessage(err),
				});
			}
		},
	});

	const handleRotate = useStable(async (key: ContextApiKey) => {
		setRotatingId(key.id);
		try {
			const result = await rotateMutation.mutateAsync(key.id);
			if (result?.key) {
				onKeyMinted(result);
			}
			showInfo({ title: "Key rotated", subtitle: `${key.name} now has a new secret.` });
		} catch (err) {
			showErrorNotification({
				title: "Couldn't rotate key",
				content: errorMessage(err),
			});
		} finally {
			setRotatingId(null);
		}
	});

	return (
		<Box>
			<SectionTitle
				kicker="Access"
				order={2}
				mb="md"
				description="API keys issued for this context. The list endpoint doesn't expose principal binding, so these are shown context-wide."
			>
				Context API keys
			</SectionTitle>

			{keysQuery.isError ? (
				<PageError
					title="Couldn't load API keys"
					message={errorMessage(keysQuery.error)}
					onRetry={() => keysQuery.refetch()}
				/>
			) : keysQuery.isPending ? (
				<Skeleton
					h={120}
					radius="md"
				/>
			) : keys.length === 0 ? (
				<EmptyState
					icon={iconKey}
					title="No context API keys"
					description="Mint a scoped key from a principal above to issue context access."
				/>
			) : (
				<Paper
					radius="sm"
					withBorder
					style={{ overflow: "hidden" }}
				>
					<Table.ScrollContainer minWidth={420}>
						<Table
							striped
							verticalSpacing="sm"
							horizontalSpacing="md"
						>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Name</Table.Th>
									<Table.Th
										style={{ width: 140 }}
										ta="right"
									>
										Actions
									</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{keys.map((key) => (
									<Table.Tr key={key.id}>
										<Table.Td>
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
													<Icon path={iconKey} />
												</ThemeIcon>
												<Text
													fw={500}
													c="bright"
													className="selectable"
												>
													{key.name}
												</Text>
											</Group>
										</Table.Td>
										<Table.Td ta="right">
											<Group
												gap="xs"
												justify="flex-end"
												wrap="nowrap"
											>
												<Tooltip label="Rotate key">
													<ActionIcon
														variant="subtle"
														color="slate"
														size="sm"
														aria-label={`Rotate ${key.name}`}
														loading={rotatingId === key.id}
														onClick={() => handleRotate(key)}
													>
														<Icon path={iconRefresh} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Revoke key">
													<ActionIcon
														variant="subtle"
														color="red"
														size="sm"
														aria-label={`Revoke ${key.name}`}
														loading={
															deleteMutation.isPending &&
															deleteMutation.variables === key.id
														}
														onClick={() => confirmRevoke(key)}
													>
														<Icon path={iconTrash} />
													</ActionIcon>
												</Tooltip>
											</Group>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				</Paper>
			)}
		</Box>
	);
}

// ─── Modals ───

interface AddMemberModalProps {
	context: ContextViewProps["context"];
	principals: SpectronPrincipal[];
	opened: boolean;
	onClose: () => void;
}

function AddMemberModal({ context, principals, opened, onClose }: AddMemberModalProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const membersQuery = useCloudMembersQuery(org);
	const addMutation = useAddContextUserMutation(org, ctxId);

	const [userId, setUserId] = useState<string | null>(null);

	// Best-effort: hide members already linked to a principal where we can match.
	const linkedUserIds = useMemo(() => {
		const set = new Set<string>();
		for (const p of principals) {
			const linked = readLinkedUser(p);
			if (linked) set.add(linked);
		}
		return set;
	}, [principals]);

	const options = useMemo(() => {
		const members = membersQuery.data ?? [];
		return members
			.filter((m) => !linkedUserIds.has(m.user_id))
			.map((m) => ({
				value: m.user_id,
				label: m.name || m.username || m.user_id,
			}));
	}, [membersQuery.data, linkedUserIds]);

	const handleAdd = useStable(async () => {
		if (!userId) return;
		try {
			await addMutation.mutateAsync({ user_id: userId });
			showInfo({
				title: "Member added",
				subtitle: "The member now has a principal in this context.",
			});
			setUserId(null);
			onClose();
		} catch (err) {
			showErrorNotification({
				title: "Couldn't add member",
				content: errorMessage(err),
			});
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Add member</Text>}
		>
			<Stack gap="md">
				<Text
					fz="sm"
					className="selectable"
				>
					Pick an organization member to grant them a human principal in this context.
				</Text>
				{membersQuery.isError ? (
					<PageError
						title="Couldn't load members"
						message={errorMessage(membersQuery.error)}
					/>
				) : (
					<Select
						label="Member"
						placeholder={
							membersQuery.isPending ? "Loading members…" : "Select a member"
						}
						data={options}
						value={userId}
						onChange={setUserId}
						disabled={membersQuery.isPending}
						searchable
						nothingFoundMessage="No eligible members"
						renderOption={({ option }) => {
							const member = membersQuery.data?.find(
								(m) => m.user_id === option.value,
							);
							return (
								<Group
									gap="sm"
									wrap="nowrap"
								>
									<Avatar
										src={member?.profile_picture}
										radius="xl"
										size="sm"
									>
										{(member?.name ?? member?.username ?? "?")
											.slice(0, 1)
											.toUpperCase()}
									</Avatar>
									<Text fz="sm">{option.label}</Text>
								</Group>
							);
						}}
					/>
				)}
				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="slate"
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						variant="gradient"
						disabled={!userId}
						loading={addMutation.isPending}
						onClick={handleAdd}
					>
						Add member
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

interface CreatePrincipalModalProps {
	context: ContextViewProps["context"];
	principals: SpectronPrincipal[];
	kind: SpectronPrincipalKind;
	setKind: (kind: SpectronPrincipalKind) => void;
	opened: boolean;
	onClose: () => void;
}

function CreatePrincipalModal({
	context,
	principals,
	kind,
	setKind,
	opened,
	onClose,
}: CreatePrincipalModalProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const createMutation = useCreatePrincipalMutation(org, ctxId);

	const [displayName, setDisplayName] = useState("");
	const [ownerId, setOwnerId] = useState<string | null>(null);
	const [readPatterns, setReadPatterns] = useState<string[]>([]);

	// Possible owners: humans and services (not the principal being created).
	const ownerOptions = useMemo(
		() =>
			principals
				.filter((p) => p.kind === "human" || p.kind === "service")
				.map((p) => ({ value: p.id, label: p.display_name || p.id })),
		[principals],
	);

	const reset = () => {
		setDisplayName("");
		setOwnerId(null);
		setReadPatterns([]);
	};

	const handleCreate = useStable(async () => {
		const name = displayName.trim();
		if (!name) return;

		const grants: SpectronGrants = {};
		const reads = readPatterns.filter((p) => p.trim().length > 0);
		if (reads.length > 0) {
			grants.read = reads;
		}

		// `metadata.owner` is best-effort — the API has no explicit parent field,
		// so it's harmless if the server ignores it.
		const body: Parameters<typeof createMutation.mutateAsync>[0] & {
			metadata?: Record<string, unknown>;
		} = {
			kind,
			display_name: name,
			...(Object.keys(grants).length > 0 ? { grants } : {}),
			...(ownerId ? { metadata: { owner: ownerId } } : {}),
		};

		try {
			await createMutation.mutateAsync(body);
			showInfo({
				title: `${KIND_META[kind].label} created`,
				subtitle: `${name} can now act within this context.`,
			});
			reset();
			onClose();
		} catch (err) {
			showErrorNotification({
				title: "Couldn't create principal",
				content: errorMessage(err),
			});
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Create principal</Text>}
		>
			<Stack gap="md">
				<Box>
					<Text
						fz="sm"
						fw={500}
						mb={6}
					>
						Kind
					</Text>
					<SegmentedControl
						fullWidth
						value={kind}
						onChange={(v) => setKind(v as SpectronPrincipalKind)}
						data={[
							{ value: "agent", label: "Agent" },
							{ value: "service", label: "Service" },
						]}
					/>
				</Box>

				<TextInput
					label="Display name"
					placeholder="e.g. Research assistant"
					required
					value={displayName}
					onChange={(e) => setDisplayName(e.currentTarget.value)}
				/>

				<Select
					label="Owner"
					description="Optional. Records which member or service this principal acts under (best-effort)."
					placeholder="No owner"
					data={ownerOptions}
					value={ownerId}
					onChange={setOwnerId}
					clearable
					searchable
				/>

				<TagsInput
					label="Initial read grants"
					description="Optional. Scope patterns this principal can read, e.g. org/apple/*"
					placeholder="Add scope pattern…"
					value={readPatterns}
					onChange={setReadPatterns}
					clearable
				/>

				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="slate"
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						variant="gradient"
						disabled={!displayName.trim()}
						loading={createMutation.isPending}
						onClick={handleCreate}
					>
						Create
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

interface MintKeyModalProps {
	context: ContextViewProps["context"];
	principal: SpectronPrincipal;
	opened: boolean;
	onClose: () => void;
	onKeyMinted: (key: ContextApiKey) => void;
}

function MintKeyModal({ context, principal, opened, onClose, onKeyMinted }: MintKeyModalProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const mintMutation = useMintScopedKeyMutation(org, ctxId);

	const [name, setName] = useState("");
	const [ttlValue, setTtlValue] = useState<number | string>("");
	const [ttlUnit, setTtlUnit] = useState("days");
	// Attenuation: optional read/write narrowing of the principal's grants.
	const [readPatterns, setReadPatterns] = useState<string[]>([]);
	const [writePatterns, setWritePatterns] = useState<string[]>([]);

	const reset = () => {
		setName("");
		setTtlValue("");
		setTtlUnit("days");
		setReadPatterns([]);
		setWritePatterns([]);
	};

	const handleMint = useStable(async () => {
		const trimmed = name.trim();
		if (!trimmed) return;

		const grants: SpectronGrants = {};
		const reads = readPatterns.filter((p) => p.trim().length > 0);
		const writes = writePatterns.filter((p) => p.trim().length > 0);
		if (reads.length > 0) grants.read = reads;
		if (writes.length > 0) grants.write = writes;

		const numeric = typeof ttlValue === "number" ? ttlValue : Number.parseInt(ttlValue, 10);
		const unitSeconds = ttlUnit === "hours" ? 3600 : ttlUnit === "minutes" ? 60 : 86400;
		const ttlSeconds =
			Number.isFinite(numeric) && numeric > 0 ? numeric * unitSeconds : undefined;

		try {
			const result = await mintMutation.mutateAsync({
				name: trimmed,
				principal_id: principal.id,
				...(Object.keys(grants).length > 0 ? { grants } : {}),
				...(ttlSeconds ? { ttl_seconds: ttlSeconds } : {}),
			});
			if (result?.key) {
				onKeyMinted(result);
			}
			reset();
			onClose();
		} catch (err) {
			showErrorNotification({
				title: "Couldn't mint key",
				content: errorMessage(err),
			});
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Mint key for {principal.display_name || "principal"}</Text>}
		>
			<Stack gap="md">
				<Text
					fz="sm"
					className="selectable"
				>
					Issue an API key bound to this principal. Leave the grant fields empty to
					inherit the principal's full access, or narrow them to attenuate the key.
				</Text>

				<TextInput
					label="Name"
					placeholder="e.g. CI pipeline"
					required
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
				/>

				<TagsInput
					label="Read scopes (optional attenuation)"
					placeholder="Add scope pattern…"
					value={readPatterns}
					onChange={setReadPatterns}
					clearable
				/>
				<TagsInput
					label="Write scopes (optional attenuation)"
					placeholder="Add scope pattern…"
					value={writePatterns}
					onChange={setWritePatterns}
					clearable
				/>

				<Group
					align="flex-end"
					gap="sm"
				>
					<NumberInput
						label="Expires after"
						description="Optional. Leave blank for no expiry."
						placeholder="e.g. 30"
						min={1}
						value={ttlValue}
						onChange={setTtlValue}
						flex={1}
					/>
					<Select
						data={[
							{ value: "minutes", label: "Minutes" },
							{ value: "hours", label: "Hours" },
							{ value: "days", label: "Days" },
						]}
						value={ttlUnit}
						onChange={(v) => setTtlUnit(v ?? "days")}
						w={120}
					/>
				</Group>

				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="slate"
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						variant="gradient"
						disabled={!name.trim()}
						loading={mintMutation.isPending}
						onClick={handleMint}
					>
						Mint key
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

// ─── One-time secret reveal ───

interface OneTimeKeyAlertProps {
	apiKey: ContextApiKey;
	onClose: () => void;
}

function OneTimeKeyAlert({ apiKey, onClose }: OneTimeKeyAlertProps) {
	return (
		<Alert
			color="blue"
			variant="light"
			title={`API key${apiKey.name ? ` · ${apiKey.name}` : ""}`}
			withCloseButton
			onClose={onClose}
			icon={<Icon path={iconKey} />}
			style={{
				borderColor: "rgba(from var(--mantine-color-blue-4) r g b / 0.15)",
			}}
		>
			<Text
				mb="xs"
				className="selectable"
			>
				Copy your API key now, as it will no longer be visible after this point.
			</Text>
			<CopyButton value={apiKey.key ?? ""}>
				{({ copied, copy }) => (
					<Box
						onClick={copy}
						mt="md"
					>
						<TextInput
							value={apiKey.key ?? ""}
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
		</Alert>
	);
}

// ─── Small helpers ───

interface KeyValueProps {
	label: string;
	value: string;
	copyable?: boolean;
}

function KeyValue({ label, value, copyable }: KeyValueProps) {
	return (
		<Box miw={0}>
			<Text
				fz="xs"
				c="slate"
			>
				{label}
			</Text>
			<Group
				gap={4}
				wrap="nowrap"
			>
				<Text
					className={`${classes.monoValue} selectable`}
					c="bright"
				>
					{value}
				</Text>
				{copyable && (
					<CopyButton value={value}>
						{({ copied, copy }) => (
							<ActionIcon
								variant="subtle"
								color={copied ? "green" : "slate"}
								size="xs"
								onClick={copy}
								aria-label={`Copy ${label}`}
							>
								<Icon path={copied ? iconCheck : iconCopy} />
							</ActionIcon>
						)}
					</CopyButton>
				)}
			</Group>
		</Box>
	);
}
