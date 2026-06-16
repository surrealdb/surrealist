import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Collapse,
	Group,
	Menu,
	Modal,
	Paper,
	Skeleton,
	Stack,
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Spectron } from "@surrealdb/spectron";
import { ScopeError } from "@surrealdb/spectron";
import {
	Icon,
	iconChevronRight,
	iconDelete,
	iconDotsVertical,
	iconFolderPlus,
	iconFolderSecure,
	iconOpenFolder,
	pictoBadgeAccessGradient,
} from "@surrealdb/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../components/ContextHero";
import { EmptyState, PageError, SpectronGate } from "../../components/feedback";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

// The SDK declares `ScopeNodeJson` as a non-exported local alias, so we recover
// it from the `scopes.list()` return type instead of importing it by name.
type ScopeNodeJson = Awaited<ReturnType<Spectron["scopes"]["list"]>>[number];

// ─── Tree model ───

interface ScopeTreeNode {
	/** Last path segment — the label for this row. */
	segment: string;
	/** Canonical full path with trailing slash, e.g. `org/apple/`. */
	path: string;
	/** Soft-delete timestamp, when tombstoned. */
	tombstonedAt?: string | null;
	/** Whether the backend actually registered this node (vs. an implied ancestor). */
	registered: boolean;
	depth: number;
	children: ScopeTreeNode[];
}

/**
 * Splits each scope `path` on `/` and folds the segments into a nested tree.
 * Ancestors that are implied by a deeper path but never registered themselves
 * are still materialised (as folders) so the hierarchy stays connected.
 */
function buildTree(nodes: ScopeNodeJson[]): ScopeTreeNode[] {
	const roots: ScopeTreeNode[] = [];
	const byPath = new Map<string, ScopeTreeNode>();

	// Stable order keeps siblings alphabetical regardless of fetch order.
	const sorted = [...nodes].sort((a, b) => a.path.localeCompare(b.path));

	for (const node of sorted) {
		// Drop the trailing empty segment from the canonical trailing slash.
		const segments = node.path.split("/").filter((s) => s.length > 0);
		if (segments.length === 0) {
			continue;
		}

		let parent: ScopeTreeNode | null = null;
		let prefix = "";

		segments.forEach((segment, index) => {
			prefix += `${segment}/`;
			let current = byPath.get(prefix);

			if (!current) {
				current = {
					segment,
					path: prefix,
					registered: false,
					depth: index,
					children: [],
				};
				byPath.set(prefix, current);
				if (parent) {
					parent.children.push(current);
				} else {
					roots.push(current);
				}
			}

			// The final segment is the node we actually fetched.
			if (index === segments.length - 1) {
				current.registered = true;
				current.tombstonedAt = node.tombstonedAt;
			}

			parent = current;
		});
	}

	return roots;
}

/** Collects the paths that should start expanded (depth 0 and 1). */
function defaultExpanded(roots: ScopeTreeNode[]): Set<string> {
	const open = new Set<string>();
	const walk = (node: ScopeTreeNode) => {
		if (node.depth <= 0 && node.children.length > 0) {
			open.add(node.path);
		}
		node.children.forEach(walk);
	};
	roots.forEach(walk);
	return open;
}

// ─── Path validation ───

const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Validates a slash-separated scope path: lowercase segments, no spaces, no
 * `=` or `*`, and no empty segments. Returns an error string, or `null` when
 * the path is acceptable.
 */
function validatePath(raw: string): string | null {
	const value = raw.trim();
	if (!value) {
		return "Enter a scope path";
	}
	if (/\s/.test(value)) {
		return "Paths cannot contain spaces";
	}
	if (value.includes("=") || value.includes("*")) {
		return "Paths cannot contain '=' or '*'";
	}

	const segments = value.replace(/\/+$/, "").split("/");
	if (segments.some((s) => s.length === 0)) {
		return "Paths cannot contain empty segments";
	}
	if (!segments.every((s) => SEGMENT.test(s))) {
		return "Use lowercase segments like org/apple/product";
	}
	return null;
}

// ─── Page ───

// biome-ignore lint/correctness/noUnusedFunctionParameters: standard ContextViewProps page signature; the scope tree is keyed off the live client, not the cloud context
export default function ScopesView({ context }: ContextViewProps) {
	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Scopes"
				title="Scope hierarchy"
				description="Scopes are hierarchical slash-path folders that partition your memory and gate which principals can see which facts. Register the folders you need, then grant principals access to the branches they should reach."
				art={pictoBadgeAccessGradient}
			/>

			<Alert
				color="violet"
				variant="light"
				icon={<Icon path={iconFolderSecure} />}
				title="How scopes gate access"
			>
				<Text
					fz="sm"
					className="selectable"
				>
					A fact stored at a node is visible only to principals explicitly granted that
					node — access is deny-by-default, with no implicit access to ancestor or
					descendant scopes. Tombstoning a scope is reversible; forgetting one erases its
					facts permanently.
				</Text>
			</Alert>

			<SpectronGate loadingMessage="Connecting to scopes…">
				{(client) => <ScopeManager client={client} />}
			</SpectronGate>
		</Stack>
	);
}

// ─── Scope manager (SDK-powered) ───

function ScopeManager({ client }: { client: Spectron }) {
	const queryClient = useQueryClient();
	const queryKey = ["spectron", client.contextId, "scopes", "list"];

	const scopesQuery = useQuery({
		queryKey,
		queryFn: () => client.scopes.list(),
		retry: false,
	});

	const tree = useMemo(() => buildTree(scopesQuery.data ?? []), [scopesQuery.data]);

	const [expanded, setExpanded] = useState<Set<string> | null>(null);
	// Seed the expand state once the first tree arrives, then leave it to the user.
	const effectiveExpanded = expanded ?? defaultExpanded(tree);

	const toggle = (path: string) => {
		setExpanded((prev) => {
			const next = new Set(prev ?? defaultExpanded(tree));
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	const invalidate = () => queryClient.invalidateQueries({ queryKey });

	// Register modal — optionally prefilled with a parent path for "Register child".
	const [registerOpened, registerHandlers] = useDisclosure(false);
	const [prefillPath, setPrefillPath] = useState("");

	const openRegister = (path = "") => {
		setPrefillPath(path);
		registerHandlers.open();
	};

	const deleteMutation = useMutation({
		mutationFn: (path: string) => client.scopes.delete(path),
		onSuccess: (_data, path) => {
			showInfo({ title: "Scope tombstoned", subtitle: path });
			invalidate();
		},
		onError: (error: unknown) => {
			if (error instanceof ScopeError) {
				showErrorNotification({
					title: "Permission required",
					content: new Error("You need the scope:delete grant to tombstone scopes here."),
				});
			} else {
				showErrorNotification({
					title: "Failed to tombstone scope",
					content: error,
				});
			}
		},
	});

	if (scopesQuery.isError) {
		return (
			<PageError
				title="Couldn't load scopes"
				message="Reading the scope hierarchy requires read access to this context. Check that your principal has a scope floor here, then try again."
				onRetry={() => scopesQuery.refetch()}
			/>
		);
	}

	if (scopesQuery.isPending) {
		return (
			<Stack gap="sm">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={i}
						h={52}
						radius="md"
					/>
				))}
			</Stack>
		);
	}

	if (tree.length === 0) {
		return (
			<>
				<EmptyState
					icon={iconFolderSecure}
					title="No scopes registered yet"
					description="Scopes let you partition memory into access-gated folders. Register your first scope to start organising what each principal can reach."
					action={
						<Button
							mt="sm"
							variant="gradient"
							leftSection={<Icon path={iconFolderPlus} />}
							onClick={() => openRegister()}
						>
							Register scope
						</Button>
					}
				/>
				<RegisterModal
					opened={registerOpened}
					onClose={registerHandlers.close}
					client={client}
					initialPath={prefillPath}
					existing={scopesQuery.data ?? []}
					onRegistered={invalidate}
				/>
			</>
		);
	}

	return (
		<>
			<Group
				justify="space-between"
				gap="md"
			>
				<Text
					fw={600}
					c="bright"
				>
					{tree.length === 1 ? "1 root scope" : `${tree.length} root scopes`}
				</Text>
				<Button
					size="sm"
					variant="gradient"
					leftSection={<Icon path={iconFolderPlus} />}
					onClick={() => openRegister()}
				>
					Register scope
				</Button>
			</Group>

			<Paper
				radius="md"
				withBorder
				p="xs"
			>
				<Stack gap={2}>
					{tree.map((node) => (
						<ScopeRow
							key={node.path}
							node={node}
							expanded={effectiveExpanded}
							onToggle={toggle}
							onRegisterChild={(path) => openRegister(path)}
							onTombstone={(path) => deleteMutation.mutate(path)}
							tombstoning={deleteMutation.isPending}
						/>
					))}
				</Stack>
			</Paper>

			<RegisterModal
				opened={registerOpened}
				onClose={registerHandlers.close}
				client={client}
				initialPath={prefillPath}
				existing={scopesQuery.data ?? []}
				onRegistered={invalidate}
			/>
		</>
	);
}

// ─── Tree row ───

interface ScopeRowProps {
	node: ScopeTreeNode;
	expanded: Set<string>;
	onToggle: (path: string) => void;
	onRegisterChild: (parentPath: string) => void;
	onTombstone: (path: string) => void;
	tombstoning: boolean;
}

function ScopeRow({
	node,
	expanded,
	onToggle,
	onRegisterChild,
	onTombstone,
	tombstoning,
}: ScopeRowProps) {
	const hasChildren = node.children.length > 0;
	const isOpen = expanded.has(node.path);
	const tombstoned = Boolean(node.tombstonedAt);

	return (
		<Box>
			<Group
				gap={4}
				wrap="nowrap"
				className={classes.row}
				style={{ paddingLeft: `calc(${node.depth} * var(--mantine-spacing-lg))` }}
			>
				<UnstyledButton
					className={classes.disclosure}
					onClick={() => hasChildren && onToggle(node.path)}
					aria-label={hasChildren ? (isOpen ? "Collapse" : "Expand") : undefined}
					data-leaf={!hasChildren}
					flex={1}
				>
					<Group
						gap="xs"
						wrap="nowrap"
					>
						<Icon
							path={iconChevronRight}
							size="sm"
							c="slate"
							className={classes.chevron}
							data-open={isOpen}
							style={{ visibility: hasChildren ? "visible" : "hidden" }}
						/>
						<ThemeIcon
							size={28}
							radius="md"
							variant="light"
							color={tombstoned ? "slate" : "violet"}
						>
							<Icon
								path={isOpen && hasChildren ? iconOpenFolder : iconFolderSecure}
							/>
						</ThemeIcon>
						<Text
							fw={500}
							c={tombstoned ? "slate" : "bright"}
							td={tombstoned ? "line-through" : undefined}
						>
							{node.segment}
						</Text>
						<Text
							fz="xs"
							c="slate"
							className={`${classes.path} selectable`}
						>
							{node.path}
						</Text>
						{tombstoned && (
							<Badge
								size="xs"
								variant="light"
								color="orange"
							>
								Tombstoned
							</Badge>
						)}
						{!node.registered && (
							<Tooltip label="Implied ancestor — not registered on its own">
								<Badge
									size="xs"
									color="slate"
								>
									Implied
								</Badge>
							</Tooltip>
						)}
					</Group>
				</UnstyledButton>

				<Menu
					position="bottom-end"
					withinPortal
				>
					<Menu.Target>
						<ActionIcon
							variant="subtle"
							color="slate"
							size="sm"
							className={classes.actions}
							aria-label={`Actions for ${node.path}`}
						>
							<Icon path={iconDotsVertical} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item
							leftSection={<Icon path={iconFolderPlus} />}
							onClick={() => onRegisterChild(node.path)}
						>
							Register child
						</Menu.Item>
						<Menu.Item
							color="red"
							leftSection={<Icon path={iconDelete} />}
							disabled={tombstoned || tombstoning}
							onClick={() => onTombstone(node.path)}
						>
							Tombstone
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>

			{hasChildren && (
				<Collapse expanded={isOpen}>
					<Stack gap={2}>
						{node.children.map((child) => (
							<ScopeRow
								key={child.path}
								node={child}
								expanded={expanded}
								onToggle={onToggle}
								onRegisterChild={onRegisterChild}
								onTombstone={onTombstone}
								tombstoning={tombstoning}
							/>
						))}
					</Stack>
				</Collapse>
			)}
		</Box>
	);
}

// ─── Register modal ───

interface RegisterModalProps {
	opened: boolean;
	onClose: () => void;
	client: Spectron;
	initialPath: string;
	existing: ScopeNodeJson[];
	onRegistered: () => void;
}

function RegisterModal({
	opened,
	onClose,
	client,
	initialPath,
	existing,
	onRegistered,
}: RegisterModalProps) {
	const [path, setPath] = useState(initialPath);
	const [displayName, setDisplayName] = useState("");
	const [description, setDescription] = useState("");
	const [touched, setTouched] = useState(false);
	const [permissionError, setPermissionError] = useState(false);

	// Re-seed the form whenever the modal opens (handles "Register child" prefill).
	const [lastOpened, setLastOpened] = useState(false);
	if (opened !== lastOpened) {
		setLastOpened(opened);
		if (opened) {
			setPath(initialPath);
			setDisplayName("");
			setDescription("");
			setTouched(false);
			setPermissionError(false);
		}
	}

	const validationError = validatePath(path);
	const canonical = path.trim().replace(/\/+$/, "");
	const duplicate =
		!validationError &&
		existing.some((n) => n.path.replace(/\/+$/, "") === canonical && canonical.length > 0);

	const mutation = useMutation({
		mutationFn: () =>
			client.scopes.register({
				path: path.trim(),
				displayName: displayName.trim() || undefined,
				description: description.trim() || undefined,
			}),
		onSuccess: () => {
			showInfo({ title: "Scope registered", subtitle: path.trim() });
			onRegistered();
			onClose();
		},
		onError: (error: unknown) => {
			if (error instanceof ScopeError) {
				// Surface inline rather than crashing — this page is open to all principals.
				setPermissionError(true);
			} else {
				showErrorNotification({
					title: "Failed to register scope",
					content: error,
				});
			}
		},
	});

	const submit = () => {
		setTouched(true);
		if (validationError || duplicate) {
			return;
		}
		setPermissionError(false);
		mutation.mutate();
	};

	const shownError = touched ? validationError : null;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Text fw={600}>Register scope</Text>}
		>
			<Stack gap="md">
				<Text
					fz="sm"
					className="selectable"
				>
					Scopes are slash-path folders (e.g.{" "}
					<Text
						span
						ff="monospace"
						c="bright"
					>
						org/apple/product
					</Text>
					). Missing ancestors are created automatically.
				</Text>

				{permissionError && (
					<Alert
						color="red"
						variant="light"
						title="Permission required"
					>
						You need the scope:create grant to register scopes here.
					</Alert>
				)}

				<TextInput
					label="Path"
					placeholder="org/apple/product"
					required
					value={path}
					error={shownError ?? (duplicate ? "This scope already exists" : undefined)}
					onChange={(e) => {
						setPath(e.currentTarget.value);
						setTouched(true);
						setPermissionError(false);
					}}
					styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
				/>
				<TextInput
					label="Display name"
					description="Optional label for the UI"
					placeholder="Apple — Product"
					value={displayName}
					onChange={(e) => setDisplayName(e.currentTarget.value)}
				/>
				<Textarea
					label="Description"
					description="Optional notes about what lives in this scope"
					placeholder="What belongs under this scope?"
					autosize
					minRows={2}
					maxRows={4}
					value={description}
					onChange={(e) => setDescription(e.currentTarget.value)}
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
						leftSection={<Icon path={iconFolderPlus} />}
						onClick={submit}
						disabled={Boolean(validationError) || duplicate}
						loading={mutation.isPending}
					>
						Register scope
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
