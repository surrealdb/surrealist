import {
	Accordion,
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Collapse,
	CopyButton,
	Divider,
	Group,
	Modal,
	Paper,
	Select,
	Stack,
	Table,
	TagsInput,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import {
	Icon,
	iconAccount,
	iconAccountPlus,
	iconAutoFix,
	iconCheck,
	iconChevronDown,
	iconCopy,
	iconKey,
	iconPlus,
	iconRefresh,
	iconServer,
	iconTrash,
	pictoBadgeAccessGradient,
	pictoFingerPrintsGradient,
	SectionTitle,
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
	type SpectronVerb,
} from "~/types";
import { ON_FOCUS_SELECT, showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../../components/ContextHero";
import { EmptyState, PageError, PageLoading } from "../../../components/feedback";
import type { ContextViewProps } from "../../../types";
import classes from "../style.module.scss";

/**
 * Agents have no parent/owner field on the Cloud API, so ownership is encoded
 * in the agent's `display_name` as `"<owner display name> / <agent name>"`.
 * This separator is the convention the whole tab relies on to nest agents
 * under the human or service principal that owns them.
 */
const SEP = " / ";

type OwnerKind = "human" | "service";

const VERB_HELP: Record<SpectronVerb, string> = {
	read: "Read facts in the granted scopes",
	write: "Create and supersede facts in the granted scopes",
	create_scope: "Register new scope nodes",
	delete_scope: "Tombstone scope nodes",
	grant: "Share access with other principals",
	manage: "Manage principals, keys, and configuration",
	forget: "Permanently erase facts (GDPR)",
};

// ─── Grant helpers ───

type GrantDraft = Record<SpectronVerb, string[]>;

function grantsToDraft(grants?: SpectronGrants): GrantDraft {
	const draft = {} as GrantDraft;
	for (const verb of SPECTRON_VERBS) {
		draft[verb] = grants?.[verb] ?? [];
	}
	return draft;
}

function draftToGrants(draft: GrantDraft): SpectronGrants {
	const grants: SpectronGrants = {};
	for (const verb of SPECTRON_VERBS) {
		const patterns = draft[verb].map((p) => p.trim()).filter(Boolean);
		if (patterns.length > 0) {
			grants[verb] = patterns;
		}
	}
	return grants;
}

function grantSummary(grants?: SpectronGrants) {
	return SPECTRON_VERBS.map((verb) => ({ verb, patterns: grants?.[verb] ?? [] })).filter(
		(entry) => entry.patterns.length > 0,
	);
}

function errorContent(err: unknown) {
	return err instanceof Error ? err : String(err);
}

// ─── Tab ───

export function PrincipalsTab({ context, kind }: ContextViewProps & { kind: OwnerKind }) {
	const org = context.organization_id;
	const ctxId = context.id;

	const principalsQuery = useCloudContextPrincipalsQuery(org, ctxId);
	const [mintedKey, setMintedKey] = useState<ContextApiKey | null>(null);

	const principals = principalsQuery.data ?? [];

	const owners = useMemo(() => principals.filter((p) => p.kind === kind), [principals, kind]);
	const agents = useMemo(() => principals.filter((p) => p.kind === "agent"), [principals]);

	// Agents whose name prefix matches no human or service principal at all.
	const orphanAgents = useMemo(() => {
		const named = principals.filter((p) => p.kind === "human" || p.kind === "service");
		return agents.filter(
			(agent) =>
				!named.some((owner) => agent.display_name.startsWith(owner.display_name + SEP)),
		);
	}, [principals, agents]);

	const isHuman = kind === "human";

	const onKeyMinted = (key: ContextApiKey) => {
		if (key.key) {
			setMintedKey(key);
		}
	};

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title={isHuman ? "Users" : "Service Accounts"}
				description={
					isHuman
						? "Organisation members with access to this context, and the agents that act on their behalf."
						: "Non-human service principals for integrations and pipelines, and the agents that run under them."
				}
				art={isHuman ? pictoFingerPrintsGradient : pictoBadgeAccessGradient}
			>
				<PrimaryAction
					context={context}
					kind={kind}
					existing={owners}
				/>
			</ContextHero>

			{mintedKey?.key && (
				<MintedKeyAlert
					apiKey={mintedKey}
					onDismiss={() => setMintedKey(null)}
				/>
			)}

			<Box>
				<SectionTitle
					kicker={isHuman ? "Members" : "Accounts"}
					order={2}
					mb="md"
				>
					{isHuman ? "Users" : "Service accounts"}
				</SectionTitle>

				{principalsQuery.isPending ? (
					<PageLoading />
				) : principalsQuery.isError ? (
					<PageError
						title="Couldn't load principals"
						message={errorContent(principalsQuery.error).toString()}
						onRetry={() => principalsQuery.refetch()}
					/>
				) : owners.length === 0 ? (
					<EmptyState
						icon={isHuman ? iconAccount : iconServer}
						title={isHuman ? "No users yet" : "No service accounts yet"}
						description={
							isHuman
								? "Add an organisation member to give them access to this context."
								: "Create a service account for an integration or automated pipeline."
						}
						action={
							<PrimaryAction
								context={context}
								kind={kind}
								existing={owners}
							/>
						}
					/>
				) : (
					<Accordion
						multiple
						className={classes.principalsAccordion}
					>
						{owners.map((owner) => (
							<PrincipalCard
								key={owner.id}
								context={context}
								principal={owner}
								agents={agents.filter((a) =>
									a.display_name.startsWith(owner.display_name + SEP),
								)}
								kind={kind}
								onKeyMinted={onKeyMinted}
							/>
						))}
					</Accordion>
				)}
			</Box>

			{isHuman && orphanAgents.length > 0 && (
				<Box>
					<SectionTitle
						kicker="Orphans"
						order={2}
						mb="md"
						description="Agent principals whose owner could not be resolved (the owning principal may have been renamed or removed)."
					>
						Agents without an owner
					</SectionTitle>
					<Paper
						withBorder
						radius="md"
						p="md"
					>
						<Stack gap="sm">
							{orphanAgents.map((agent) => (
								<AgentItem
									key={agent.id}
									context={context}
									agent={agent}
									ownerName=""
									onKeyMinted={onKeyMinted}
								/>
							))}
						</Stack>
					</Paper>
				</Box>
			)}

			<ContextKeysSection
				context={context}
				onKeyMinted={onKeyMinted}
			/>
		</Stack>
	);
}

// ─── Primary action (add user / create service account) ───

function PrimaryAction({
	context,
	kind,
	existing,
}: {
	context: ContextViewProps["context"];
	kind: OwnerKind;
	existing: SpectronPrincipal[];
}) {
	const [opened, modal] = useDisclosure(false);

	return (
		<>
			<Button
				variant="gradient"
				leftSection={<Icon path={kind === "human" ? iconAccountPlus : iconPlus} />}
				onClick={modal.open}
			>
				{kind === "human" ? "Add user" : "Create service account"}
			</Button>
			{kind === "human" ? (
				<AddUserModal
					context={context}
					existing={existing}
					opened={opened}
					onClose={modal.close}
				/>
			) : (
				<CreateServiceModal
					context={context}
					opened={opened}
					onClose={modal.close}
				/>
			)}
		</>
	);
}

function AddUserModal({
	context,
	existing,
	opened,
	onClose,
}: {
	context: ContextViewProps["context"];
	existing: SpectronPrincipal[];
	opened: boolean;
	onClose: () => void;
}) {
	const org = context.organization_id;
	const membersQuery = useCloudMembersQuery(org);
	const addMutation = useAddContextUserMutation(org, context.id);
	const [userId, setUserId] = useState<string | null>(null);

	const taken = useMemo(() => new Set(existing.map((p) => p.display_name)), [existing]);

	const options = (membersQuery.data ?? []).map((member) => ({
		value: member.user_id,
		label: `${member.name} (@${member.username})`,
		disabled: taken.has(member.name),
	}));

	const submit = async () => {
		if (!userId) return;
		try {
			await addMutation.mutateAsync({ user_id: userId });
			showInfo({
				title: "User added",
				subtitle: "The member now has access to this context.",
			});
			setUserId(null);
			onClose();
		} catch (err) {
			showErrorNotification({ title: "Couldn't add user", content: errorContent(err) });
		}
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Add a user</Text>}
		>
			<Stack gap="md">
				<Text fz="sm">
					Grant an organisation member access to this context as a human principal.
				</Text>
				<Select
					label="Organisation member"
					placeholder="Select a member"
					data={options}
					value={userId}
					onChange={setUserId}
					searchable
					nothingFoundMessage="No members found"
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
						disabled={!userId}
						loading={addMutation.isPending}
						onClick={submit}
					>
						Add user
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

function CreateServiceModal({
	context,
	opened,
	onClose,
}: {
	context: ContextViewProps["context"];
	opened: boolean;
	onClose: () => void;
}) {
	const createMutation = useCreatePrincipalMutation(context.organization_id, context.id);
	const [name, setName] = useInputState("");
	const [draft, setDraft] = useState<GrantDraft>(() => grantsToDraft());
	const [showGrants, grantsDisclosure] = useDisclosure(false);

	const submit = async () => {
		const displayName = name.trim();
		if (!displayName) return;
		const grants = draftToGrants(draft);
		try {
			await createMutation.mutateAsync({
				kind: "service",
				display_name: displayName,
				...(Object.keys(grants).length > 0 ? { grants } : {}),
			});
			showInfo({ title: "Service account created", subtitle: displayName });
			setName("");
			setDraft(grantsToDraft());
			onClose();
		} catch (err) {
			showErrorNotification({
				title: "Couldn't create service account",
				content: errorContent(err),
			});
		}
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Create service account</Text>}
		>
			<Stack gap="md">
				<TextInput
					label="Display name"
					placeholder="e.g. ingestion-pipeline"
					value={name}
					onChange={setName}
					data-autofocus
				/>
				<OptionalGrants
					opened={showGrants}
					onToggle={grantsDisclosure.toggle}
					draft={draft}
					onChange={setDraft}
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
						disabled={!name.trim()}
						loading={createMutation.isPending}
						onClick={submit}
					>
						Create
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

// ─── Principal card (owner + nested agents) ───

function PrincipalCard({
	context,
	principal,
	agents,
	kind,
	onKeyMinted,
}: {
	context: ContextViewProps["context"];
	principal: SpectronPrincipal;
	agents: SpectronPrincipal[];
	kind: OwnerKind;
	onKeyMinted: (key: ContextApiKey) => void;
}) {
	const deleteMutation = useDeletePrincipalMutation(context.organization_id, context.id);
	const [mintOpened, mintModal] = useDisclosure(false);
	const [addAgentOpened, addAgentModal] = useDisclosure(false);

	const confirmDelete = useConfirmation<SpectronPrincipal>({
		title: kind === "human" ? "Remove user" : "Delete service account",
		message: (p) =>
			`This revokes ${p.display_name}'s access and its API keys. Agents owned by it are not removed automatically. Continue?`,
		confirmText: kind === "human" ? "Remove" : "Delete",
		confirmProps: { color: "red" },
		onConfirm: async (p) => {
			try {
				await deleteMutation.mutateAsync(p.id);
				showInfo({ title: "Principal removed", subtitle: p.display_name });
			} catch (err) {
				showErrorNotification({
					title: "Couldn't remove principal",
					content: errorContent(err),
				});
			}
		},
	});

	const summary = grantSummary(principal.grants);

	return (
		<Accordion.Item value={principal.id}>
			<Accordion.Control
				icon={
					<ThemeIcon
						size={28}
						radius="md"
						variant="light"
						color="violet"
					>
						<Icon path={kind === "human" ? iconAccount : iconServer} />
					</ThemeIcon>
				}
			>
				<Group
					justify="space-between"
					wrap="nowrap"
					pr="md"
				>
					<Text
						fw={600}
						c="bright"
						truncate
					>
						{principal.display_name}
					</Text>
					<Group gap="xs">
						{agents.length > 0 && (
							<Badge
								variant="light"
								color="slate"
								size="sm"
								leftSection={
									<Icon
										path={iconAutoFix}
										size="xs"
									/>
								}
							>
								{agents.length}
							</Badge>
						)}
						<Badge
							variant="default"
							size="sm"
						>
							{summary.length} grant{summary.length === 1 ? "" : "s"}
						</Badge>
					</Group>
				</Group>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack gap="lg">
					<GrantsEditor
						context={context}
						principalId={principal.id}
						grants={principal.grants}
					/>

					<Divider />

					{/* AGENTS */}
					<Box>
						<Group
							justify="space-between"
							mb="sm"
						>
							<Text
								fw={600}
								c="bright"
								fz="sm"
							>
								Agents
							</Text>
							<Button
								size="compact-sm"
								variant="light"
								leftSection={<Icon path={iconPlus} />}
								onClick={addAgentModal.open}
							>
								Add agent
							</Button>
						</Group>
						{agents.length === 0 ? (
							<Text
								fz="sm"
								c="slate"
							>
								No agents run under this {kind === "human" ? "user" : "account"}{" "}
								yet.
							</Text>
						) : (
							<Stack gap="sm">
								{agents.map((agent) => (
									<AgentItem
										key={agent.id}
										context={context}
										agent={agent}
										ownerName={principal.display_name}
										onKeyMinted={onKeyMinted}
									/>
								))}
							</Stack>
						)}
					</Box>

					<Divider />

					<Group gap="sm">
						<Button
							size="xs"
							variant="light"
							leftSection={<Icon path={iconKey} />}
							onClick={mintModal.open}
						>
							Mint key
						</Button>
						<Button
							size="xs"
							variant="subtle"
							color="red"
							leftSection={<Icon path={iconTrash} />}
							onClick={() => confirmDelete(principal)}
						>
							{kind === "human" ? "Remove user" : "Delete account"}
						</Button>
					</Group>
				</Stack>

				<MintKeyModal
					context={context}
					principal={principal}
					opened={mintOpened}
					onClose={mintModal.close}
					onKeyMinted={onKeyMinted}
				/>
				<AddAgentModal
					context={context}
					owner={principal}
					opened={addAgentOpened}
					onClose={addAgentModal.close}
				/>
			</Accordion.Panel>
		</Accordion.Item>
	);
}

function AgentItem({
	context,
	agent,
	ownerName,
	onKeyMinted,
}: {
	context: ContextViewProps["context"];
	agent: SpectronPrincipal;
	ownerName: string;
	onKeyMinted: (key: ContextApiKey) => void;
}) {
	const deleteMutation = useDeletePrincipalMutation(context.organization_id, context.id);
	const [mintOpened, mintModal] = useDisclosure(false);
	const [grantsOpened, grantsDisclosure] = useDisclosure(false);

	const shortName =
		ownerName && agent.display_name.startsWith(ownerName + SEP)
			? agent.display_name.slice(ownerName.length + SEP.length)
			: agent.display_name;

	const confirmDelete = useConfirmation<SpectronPrincipal>({
		title: "Delete agent",
		message: (a) =>
			`Delete agent "${a.display_name}" and revoke its keys? This cannot be undone.`,
		confirmText: "Delete",
		confirmProps: { color: "red" },
		onConfirm: async (a) => {
			try {
				await deleteMutation.mutateAsync(a.id);
				showInfo({ title: "Agent deleted", subtitle: a.display_name });
			} catch (err) {
				showErrorNotification({
					title: "Couldn't delete agent",
					content: errorContent(err),
				});
			}
		},
	});

	const summary = grantSummary(agent.grants);

	return (
		<Paper
			withBorder
			radius="md"
			p="sm"
		>
			<Group
				justify="space-between"
				wrap="nowrap"
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
						<Icon path={iconAutoFix} />
					</ThemeIcon>
					<Box>
						<Text
							fw={500}
							c="bright"
						>
							{shortName}
						</Text>
						<Text
							fz="xs"
							c="slate"
						>
							{summary.length} grant{summary.length === 1 ? "" : "s"}
						</Text>
					</Box>
				</Group>
				<Group gap={4}>
					<Tooltip label="Edit grants">
						<ActionIcon
							variant="subtle"
							color="slate"
							onClick={grantsDisclosure.toggle}
							aria-label="Edit grants"
						>
							<Icon
								path={iconChevronDown}
								style={{
									transform: grantsOpened ? "rotate(180deg)" : undefined,
									transition: "transform .15s ease",
								}}
							/>
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Mint key">
						<ActionIcon
							variant="subtle"
							color="violet"
							onClick={mintModal.open}
							aria-label="Mint key"
						>
							<Icon path={iconKey} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Delete agent">
						<ActionIcon
							variant="subtle"
							color="red"
							onClick={() => confirmDelete(agent)}
							aria-label="Delete agent"
						>
							<Icon path={iconTrash} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>
			<Collapse expanded={grantsOpened}>
				<Box mt="md">
					<GrantsEditor
						context={context}
						principalId={agent.id}
						grants={agent.grants}
					/>
				</Box>
			</Collapse>
			<MintKeyModal
				context={context}
				principal={agent}
				opened={mintOpened}
				onClose={mintModal.close}
				onKeyMinted={onKeyMinted}
			/>
		</Paper>
	);
}

// ─── Grants editor ───

function GrantsEditor({
	context,
	principalId,
	grants,
}: {
	context: ContextViewProps["context"];
	principalId: string;
	grants?: SpectronGrants;
}) {
	const mutation = useReplacePrincipalGrantsMutation(context.organization_id, context.id);
	const [draft, setDraft] = useState<GrantDraft>(() => grantsToDraft(grants));

	const save = async () => {
		try {
			await mutation.mutateAsync({ principalId, grants: draftToGrants(draft) });
			showInfo({
				title: "Grants updated",
				subtitle: "The principal's access has been saved.",
			});
		} catch (err) {
			showErrorNotification({ title: "Couldn't update grants", content: errorContent(err) });
		}
	};

	return (
		<Box>
			<Text
				fw={600}
				c="bright"
				fz="sm"
				mb="xs"
			>
				Grants
			</Text>
			<GrantInputs
				draft={draft}
				onChange={setDraft}
			/>
			<Button
				mt="md"
				size="xs"
				variant="gradient"
				loading={mutation.isPending}
				onClick={save}
			>
				Save grants
			</Button>
		</Box>
	);
}

function GrantInputs({
	draft,
	onChange,
}: {
	draft: GrantDraft;
	onChange: (next: GrantDraft) => void;
}) {
	return (
		<Stack gap="sm">
			{SPECTRON_VERBS.map((verb) => (
				<Group
					key={verb}
					gap="sm"
					wrap="nowrap"
					align="flex-start"
				>
					<Tooltip
						label={VERB_HELP[verb]}
						position="left"
					>
						<Badge
							variant="light"
							color="violet"
							w={104}
							style={{ flexShrink: 0, justifyContent: "flex-start" }}
						>
							{verb}
						</Badge>
					</Tooltip>
					<TagsInput
						flex={1}
						value={draft[verb]}
						onChange={(patterns) => onChange({ ...draft, [verb]: patterns })}
						placeholder="Add scope pattern, e.g. org/acme/*"
						clearable
					/>
				</Group>
			))}
		</Stack>
	);
}

function OptionalGrants({
	opened,
	onToggle,
	draft,
	onChange,
}: {
	opened: boolean;
	onToggle: () => void;
	draft: GrantDraft;
	onChange: (next: GrantDraft) => void;
}) {
	return (
		<Box>
			<Button
				variant="subtle"
				color="slate"
				size="compact-sm"
				leftSection={
					<Icon
						path={iconChevronDown}
						style={{
							transform: opened ? "rotate(180deg)" : undefined,
							transition: "transform .15s ease",
						}}
					/>
				}
				onClick={onToggle}
			>
				Grants (optional)
			</Button>
			<Collapse expanded={opened}>
				<Box mt="sm">
					<Text
						fz="xs"
						c="slate"
						mb="sm"
					>
						Leave empty to grant no access initially; you can edit grants any time.
					</Text>
					<GrantInputs
						draft={draft}
						onChange={onChange}
					/>
				</Box>
			</Collapse>
		</Box>
	);
}

// ─── Mint key + add agent modals ───

function MintKeyModal({
	context,
	principal,
	opened,
	onClose,
	onKeyMinted,
}: {
	context: ContextViewProps["context"];
	principal: SpectronPrincipal;
	opened: boolean;
	onClose: () => void;
	onKeyMinted: (key: ContextApiKey) => void;
}) {
	const mintMutation = useMintScopedKeyMutation(context.organization_id, context.id);
	const [name, setName] = useInputState("");
	const [draft, setDraft] = useState<GrantDraft>(() => grantsToDraft());
	const [showGrants, grantsDisclosure] = useDisclosure(false);

	const submit = async () => {
		const keyName = name.trim();
		if (!keyName) return;
		const grants = draftToGrants(draft);
		try {
			const result = await mintMutation.mutateAsync({
				name: keyName,
				principal_id: principal.id,
				...(Object.keys(grants).length > 0 ? { grants } : {}),
			});
			onKeyMinted(result);
			showInfo({ title: "Key minted", subtitle: keyName });
			setName("");
			setDraft(grantsToDraft());
			onClose();
		} catch (err) {
			showErrorNotification({ title: "Couldn't mint key", content: errorContent(err) });
		}
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Mint key for {principal.display_name}</Text>}
		>
			<Stack gap="md">
				<Text fz="sm">
					Mints a scoped API key bound to this principal. Optional grants can only narrow
					the principal's access. The secret is shown once.
				</Text>
				<TextInput
					label="Key name"
					placeholder="e.g. production"
					value={name}
					onChange={setName}
					data-autofocus
				/>
				<OptionalGrants
					opened={showGrants}
					onToggle={grantsDisclosure.toggle}
					draft={draft}
					onChange={setDraft}
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
						disabled={!name.trim()}
						loading={mintMutation.isPending}
						onClick={submit}
					>
						Mint key
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

function AddAgentModal({
	context,
	owner,
	opened,
	onClose,
}: {
	context: ContextViewProps["context"];
	owner: SpectronPrincipal;
	opened: boolean;
	onClose: () => void;
}) {
	const createMutation = useCreatePrincipalMutation(context.organization_id, context.id);
	const [name, setName] = useInputState("");
	const [draft, setDraft] = useState<GrantDraft>(() => grantsToDraft());
	const [showGrants, grantsDisclosure] = useDisclosure(false);

	const submit = async () => {
		const shortName = name.trim();
		if (!shortName) return;
		const grants = draftToGrants(draft);
		try {
			await createMutation.mutateAsync({
				kind: "agent",
				display_name: owner.display_name + SEP + shortName,
				...(Object.keys(grants).length > 0 ? { grants } : {}),
			});
			showInfo({ title: "Agent created", subtitle: shortName });
			setName("");
			setDraft(grantsToDraft());
			onClose();
		} catch (err) {
			showErrorNotification({ title: "Couldn't create agent", content: errorContent(err) });
		}
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Add agent under {owner.display_name}</Text>}
		>
			<Stack gap="md">
				<Text fz="sm">
					Creates an agent principal owned by {owner.display_name}. It acts within the
					grants you give it.
				</Text>
				<TextInput
					label="Agent name"
					placeholder="e.g. planner"
					value={name}
					onChange={setName}
					data-autofocus
				/>
				<OptionalGrants
					opened={showGrants}
					onToggle={grantsDisclosure.toggle}
					draft={draft}
					onChange={setDraft}
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
						disabled={!name.trim()}
						loading={createMutation.isPending}
						onClick={submit}
					>
						Create agent
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

// ─── Context API keys ───

function ContextKeysSection({
	context,
	onKeyMinted,
}: {
	context: ContextViewProps["context"];
	onKeyMinted: (key: ContextApiKey) => void;
}) {
	const org = context.organization_id;
	const ctxId = context.id;
	const keysQuery = useCloudContextApiKeysQuery(org, ctxId);
	const deleteMutation = useDeleteContextApiKeyMutation(org, ctxId);
	const rotateMutation = useRotateContextApiKeyMutation(org, ctxId);

	const confirmRevoke = useConfirmation<ContextApiKey>({
		title: "Revoke key",
		message: (key) => `Revoke "${key.name}"? Any client using it will stop working.`,
		confirmText: "Revoke",
		confirmProps: { color: "red" },
		onConfirm: async (key) => {
			try {
				await deleteMutation.mutateAsync(key.id);
				showInfo({ title: "Key revoked", subtitle: key.name });
			} catch (err) {
				showErrorNotification({ title: "Couldn't revoke key", content: errorContent(err) });
			}
		},
	});

	const rotate = async (key: ContextApiKey) => {
		try {
			const result = await rotateMutation.mutateAsync(key.id);
			onKeyMinted(result);
			showInfo({ title: "Key rotated", subtitle: key.name });
		} catch (err) {
			showErrorNotification({ title: "Couldn't rotate key", content: errorContent(err) });
		}
	};

	const keys = keysQuery.data ?? [];

	return (
		<Box>
			<SectionTitle
				kicker="Credentials"
				order={2}
				mb="md"
				description="API keys minted for this context. The list does not expose which principal each key is bound to."
			>
				Context API keys
			</SectionTitle>
			<Paper
				withBorder
				radius="sm"
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
								<Table.Th style={{ width: 120 }}>Actions</Table.Th>
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
												c="bright"
												className="selectable"
											>
												{key.name}
											</Text>
										</Group>
									</Table.Td>
									<Table.Td>
										<Group gap={4}>
											<Tooltip label="Rotate key">
												<ActionIcon
													variant="subtle"
													color="slate"
													aria-label={`Rotate ${key.name}`}
													loading={
														rotateMutation.isPending &&
														rotateMutation.variables === key.id
													}
													onClick={() => rotate(key)}
												>
													<Icon path={iconRefresh} />
												</ActionIcon>
											</Tooltip>
											<Tooltip label="Revoke key">
												<ActionIcon
													variant="subtle"
													color="red"
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
							{keys.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={2}>
										<Text
											fz="sm"
											c="slate"
											py="md"
											ta="center"
										>
											No context API keys yet. Mint one from a principal
											above.
										</Text>
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Paper>
		</Box>
	);
}

// ─── One-time secret reveal ───

function MintedKeyAlert({ apiKey, onDismiss }: { apiKey: ContextApiKey; onDismiss: () => void }) {
	return (
		<Alert
			color="blue"
			variant="light"
			title={`Key "${apiKey.name}" is ready`}
			withCloseButton
			onClose={onDismiss}
			icon={<Icon path={iconKey} />}
		>
			<Text
				mb="xs"
				className="selectable"
			>
				Copy this secret now — it will not be shown again.
			</Text>
			<CopyButton value={apiKey.key ?? ""}>
				{({ copied, copy }) => (
					<TextInput
						value={apiKey.key ?? ""}
						variant="unstyled"
						readOnly
						onFocus={ON_FOCUS_SELECT}
						onClick={copy}
						styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
						leftSection={
							<Icon
								path={copied ? iconCheck : iconCopy}
								c="bright"
							/>
						}
					/>
				)}
			</CopyButton>
		</Alert>
	);
}
