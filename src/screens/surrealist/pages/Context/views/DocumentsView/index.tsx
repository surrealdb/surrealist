import {
	ActionIcon,
	Alert,
	Autocomplete,
	Badge,
	Box,
	Button,
	CloseButton,
	Drawer,
	Group,
	Loader,
	Pagination,
	Paper,
	SegmentedControl,
	SimpleGrid,
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
import {
	Icon,
	iconArrowLeft,
	iconBraces,
	iconCheck,
	iconClose,
	iconEdit,
	iconEye,
	iconFile,
	iconFolderPlus,
	iconImage,
	iconSearch,
	iconText,
	iconTrash,
	iconUpload,
	iconWarning,
	pictoDocumentGradient,
} from "@surrealdb/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useConfirmation } from "~/providers/Confirmation";
import type { SpectronScopeSets } from "~/types";
import { formatFileSize, showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../components/ContextHero";
import { EmptyState, PageError, SpectronGate } from "../../components/feedback";
import type { ContextViewProps } from "../../types";
import { normalizeScopePath, validateScopePath } from "../../utils/scope-validation";
import classes from "./style.module.scss";

// The SDK doesn't export the per-document JSON shape as a public alias, so we
// infer it from the list response (a paginated `DocumentJson[]`).
type DocumentEntry = Awaited<ReturnType<Spectron["documents"]["list"]>>["documents"][number];
type DocumentStatus = DocumentEntry["status"];
type QueryHit = Awaited<ReturnType<Spectron["documents"]["query"]>>["results"][number];
type ChunkEntry = Awaited<ReturnType<Spectron["documents"]["chunks"]>>["chunks"][number];

const PAGE_SIZE = 24;
const CHUNK_PAGE_SIZE = 10;
const POLL_INTERVAL = 3000;

/**
 * Upper bound on how many chunks the reconstructed "Document" view pulls in one
 * request, so an enormous document can't stall the drawer. Beyond this the user
 * is nudged to the paginated "Chunks" view.
 */
const DOCUMENT_VIEW_CHUNK_CAP = 2000;

/**
 * Stitches chunk text back into a single continuous document. Chunks carry
 * `charStart`/`charEnd` offsets into the original extracted text, so we sort by
 * offset and trim overlaps (retrieval chunking usually overlaps neighbours)
 * rather than naively concatenating, which would duplicate the shared spans.
 */
function reconstructDocument(chunks: ChunkEntry[]): string {
	const sorted = [...chunks].sort((a, b) => a.charStart - b.charStart);
	let text = "";
	let cursor = 0; // Highest original offset already written.

	for (const chunk of sorted) {
		if (chunk.charEnd <= cursor) continue; // Fully covered by an earlier chunk.

		if (chunk.charStart >= cursor) {
			text += chunk.text;
		} else {
			// Overlaps the tail of what we've written — skip the shared prefix.
			text += chunk.text.slice(cursor - chunk.charStart);
		}

		cursor = Math.max(cursor, chunk.charEnd);
	}

	return text;
}

/** Statuses that mean the ingestion pipeline has finished (success or failure). */
const TERMINAL_STATUSES: ReadonlySet<DocumentStatus> = new Set(["ready", "failed"]);

/** Human-readable labels for the in-flight pipeline stages. */
const STATUS_LABELS: Record<DocumentStatus, string> = {
	queued: "Queued",
	extracting: "Extracting",
	chunking: "Chunking",
	embedding: "Embedding",
	keywording: "Keywording",
	extracting_nodes: "Linking",
	ready: "Ready",
	failed: "Failed",
};

export default function DocumentsView({ context: _context }: ContextViewProps) {
	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Documents"
				title="Knowledge & documents"
				description="Ground your agent in your own source material. Upload your files, and Spectron parses, chunks, embeds, and links them, so retrieval can point back to the exact passage an answer came from."
				art={pictoDocumentGradient}
			/>

			<SpectronGate loadingMessage="Connecting to the document store…">
				{(client) => <DocumentExplorer client={client} />}
			</SpectronGate>
		</Stack>
	);
}

// ─── Explorer ───

function DocumentExplorer({ client }: { client: Spectron }) {
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false);
	const [inspecting, setInspecting] = useState<DocumentEntry | null>(null);

	const listQueryKey = ["spectron", client.contextId, "documents", "list", page] as const;

	const listQuery = useQuery({
		queryKey: listQueryKey,
		// Mantine's Pagination is 1-based; the API expects a 0-indexed page.
		queryFn: () => client.documents.list({ page: page - 1, pageSize: PAGE_SIZE }),
		retry: false,
		placeholderData: (prev) => prev,
		// Poll while anything is still being processed so statuses advance live.
		refetchInterval: (query) => {
			const docs = query.state.data?.documents ?? [];
			const inFlight = docs.some((doc) => !TERMINAL_STATUSES.has(doc.status));
			return inFlight ? POLL_INTERVAL : false;
		},
	});

	const documents = listQuery.data?.documents ?? [];
	const total = listQuery.data?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

	const invalidateList = () => {
		queryClient.invalidateQueries({
			queryKey: ["spectron", client.contextId, "documents", "list"],
		});
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => client.documents.delete(id),
		onSuccess: () => {
			invalidateList();
			showInfo({
				title: "Document deleted",
				subtitle: "It has been removed from this context.",
			});
		},
		onError: (err) => {
			showErrorNotification({ title: "Failed to delete document", content: err });
		},
	});

	const confirmDelete = useConfirmation<DocumentEntry>({
		title: "Delete document",
		message: (doc) =>
			`Are you sure you want to delete "${doc.title || doc.source || doc.id}"? It will be removed from this context.`,
		confirmText: "Delete",
		skippable: true,
		onConfirm: (doc) => deleteMutation.mutateAsync(doc.id),
	});

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		setSearchTerm(searchInput.trim());
	};

	const clearSearch = () => {
		setSearchInput("");
		setSearchTerm("");
	};

	const isSearching = searchTerm.length > 0;

	// ── Loading skeletons ──
	if (listQuery.isPending) {
		return (
			<Stack gap="lg">
				<Toolbar
					searchInput={searchInput}
					onSearchChange={setSearchInput}
					onSearchSubmit={handleSearchSubmit}
					onClearSearch={clearSearch}
					onUpload={openUpload}
					disabled
				/>
				<SimpleGrid
					cols={{ base: 1, sm: 2, lg: 3 }}
					spacing="md"
				>
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton
							key={i}
							h={104}
							radius="md"
						/>
					))}
				</SimpleGrid>
			</Stack>
		);
	}

	// ── List error ──
	if (listQuery.isError) {
		return (
			<Stack gap="lg">
				<Toolbar
					searchInput={searchInput}
					onSearchChange={setSearchInput}
					onSearchSubmit={handleSearchSubmit}
					onClearSearch={clearSearch}
					onUpload={openUpload}
				/>
				<PageError
					title="Couldn't load documents"
					message={listQuery.error instanceof Error ? listQuery.error.message : undefined}
					onRetry={() => listQuery.refetch()}
				/>
				<UploadModal
					client={client}
					opened={uploadOpened}
					onClose={closeUpload}
					onUploaded={invalidateList}
				/>
			</Stack>
		);
	}

	return (
		<Stack gap="lg">
			<Toolbar
				searchInput={searchInput}
				onSearchChange={setSearchInput}
				onSearchSubmit={handleSearchSubmit}
				onClearSearch={clearSearch}
				onUpload={openUpload}
			/>

			{isSearching ? (
				<SearchResults
					client={client}
					term={searchTerm}
					onInspect={setInspecting}
					onClear={clearSearch}
				/>
			) : documents.length === 0 ? (
				<EmptyState
					icon={iconFile}
					title="No documents yet"
					description="Upload files to ground your agent in your own source material."
					action={
						<Button
							mt="sm"
							variant="gradient"
							leftSection={<Icon path={iconUpload} />}
							onClick={openUpload}
						>
							Upload documents
						</Button>
					}
				/>
			) : (
				<>
					<SimpleGrid
						cols={{ base: 1, sm: 2, lg: 3 }}
						spacing="md"
					>
						{documents.map((doc) => (
							<DocumentCard
								key={doc.id}
								document={doc}
								onInspect={() => setInspecting(doc)}
								onDelete={() => confirmDelete(doc)}
								deleting={
									deleteMutation.isPending && deleteMutation.variables === doc.id
								}
							/>
						))}
					</SimpleGrid>
					{pageCount > 1 && (
						<Group justify="center">
							<Pagination
								total={pageCount}
								value={page}
								onChange={setPage}
							/>
						</Group>
					)}
				</>
			)}

			<UploadModal
				client={client}
				opened={uploadOpened}
				onClose={closeUpload}
				onUploaded={invalidateList}
			/>

			<InspectorDrawer
				client={client}
				document={inspecting}
				onClose={() => setInspecting(null)}
				onRenamed={(updated) => {
					setInspecting(updated);
					invalidateList();
				}}
			/>
		</Stack>
	);
}

// ─── Toolbar ───

interface ToolbarProps {
	searchInput: string;
	onSearchChange: (value: string) => void;
	onSearchSubmit: (event: React.FormEvent) => void;
	onClearSearch: () => void;
	onUpload: () => void;
	disabled?: boolean;
}

function Toolbar({
	searchInput,
	onSearchChange,
	onSearchSubmit,
	onClearSearch,
	onUpload,
	disabled,
}: ToolbarProps) {
	return (
		<Group
			justify="space-between"
			gap="md"
			wrap="nowrap"
		>
			<form
				onSubmit={onSearchSubmit}
				style={{ flex: 1, maxWidth: 460 }}
			>
				<TextInput
					placeholder="Search documents…"
					value={searchInput}
					disabled={disabled}
					onChange={(event) => onSearchChange(event.currentTarget.value)}
					leftSection={<Icon path={iconSearch} />}
					rightSection={
						searchInput ? (
							<CloseButton
								size="sm"
								aria-label="Clear search"
								onClick={onClearSearch}
							/>
						) : undefined
					}
				/>
			</form>
			<Button
				variant="gradient"
				leftSection={<Icon path={iconUpload} />}
				onClick={onUpload}
				disabled={disabled}
			>
				Upload
			</Button>
		</Group>
	);
}

// ─── Mime-type icon mapping ───

function mimeIcon(mimeType: string): string {
	const mime = mimeType.toLowerCase();
	if (mime.startsWith("image/")) return iconImage;
	if (mime.includes("json")) return iconBraces;
	if (mime.includes("markdown") || mime.startsWith("text/")) return iconText;
	return iconFile;
}

// ─── Status badge ───

function StatusBadge({ status, error }: { status: DocumentStatus; error?: string | null }) {
	if (status === "ready") {
		return (
			<Badge
				variant="light"
				color="green"
				size="sm"
			>
				Ready
			</Badge>
		);
	}

	if (status === "failed") {
		return (
			<Tooltip
				label={error || "Processing failed"}
				multiline
				maw={280}
				disabled={!error}
			>
				<Badge
					variant="light"
					color="red"
					size="sm"
				>
					Failed
				</Badge>
			</Tooltip>
		);
	}

	// Still in-flight: show a spinner alongside the stage name.
	return (
		<Badge
			variant="light"
			color="violet"
			size="sm"
			leftSection={
				<Loader
					size={10}
					color="violet"
				/>
			}
		>
			{STATUS_LABELS[status] ?? status}
		</Badge>
	);
}

// ─── Document card ───

interface DocumentCardProps {
	document: DocumentEntry;
	onInspect: () => void;
	onDelete: () => void;
	deleting: boolean;
}

function DocumentCard({ document: doc, onInspect, onDelete, deleting }: DocumentCardProps) {
	const fileName = doc.title || doc.source || doc.id;

	return (
		<Box
			pos="relative"
			h="100%"
		>
			<Paper
				p="md"
				radius="md"
				withBorder
				h="100%"
				onClick={onInspect}
			>
				<Group
					gap="sm"
					wrap="nowrap"
					align="flex-start"
				>
					<ThemeIcon
						size={40}
						radius="md"
						variant="light"
						color="violet"
					>
						<Icon
							path={mimeIcon(doc.mimeType)}
							size="lg"
						/>
					</ThemeIcon>
					<Box
						flex={1}
						miw={0}
					>
						<Group justify="space-between">
							<Text
								fw={600}
								c="bright"
								truncate
								title={fileName}
								className="selectable"
							>
								{fileName}
							</Text>

							<Tooltip label="Delete">
								<ActionIcon
									variant="subtle"
									color="red"
									size="sm"
									aria-label={`Delete ${fileName}`}
									onClick={onDelete}
									loading={deleting}
								>
									<Icon path={iconTrash} />
								</ActionIcon>
							</Tooltip>
						</Group>
						<Group
							gap={6}
							mt={4}
							wrap="wrap"
						>
							<StatusBadge
								status={doc.status}
								error={doc.error}
							/>
							<Text
								fz="xs"
								c="slate"
							>
								{formatFileSize(doc.sizeBytes)}
							</Text>
						</Group>
						<Text
							fz="xs"
							c="slate"
							mt={2}
						>
							{formatDate(doc.createdAt)}
						</Text>
					</Box>
				</Group>
			</Paper>
		</Box>
	);
}

// ─── Search mode ───

function SearchResults({
	client,
	term,
	onInspect,
	onClear,
}: {
	client: Spectron;
	term: string;
	onInspect: (document: DocumentEntry) => void;
	onClear: () => void;
}) {
	const searchQuery = useQuery({
		queryKey: ["spectron", client.contextId, "documents", "search", term],
		queryFn: () => client.documents.query({ query: term, k: 20 }),
		retry: false,
	});

	const openDocument = useOpenDocument(client, onInspect);

	if (searchQuery.isPending) {
		return (
			<Stack gap="md">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={i}
						h={92}
						radius="md"
					/>
				))}
			</Stack>
		);
	}

	if (searchQuery.isError) {
		return (
			<PageError
				title="Search failed"
				message={searchQuery.error instanceof Error ? searchQuery.error.message : undefined}
				onRetry={() => searchQuery.refetch()}
			/>
		);
	}

	const results = searchQuery.data.results;

	if (results.length === 0) {
		return (
			<EmptyState
				icon={iconSearch}
				title="No matches"
				description={`Nothing in this context matched "${term}".`}
				action={
					<Button
						mt="sm"
						variant="light"
						leftSection={<Icon path={iconArrowLeft} />}
						onClick={onClear}
					>
						Back to all documents
					</Button>
				}
			/>
		);
	}

	return (
		<Stack gap="sm">
			<Group
				justify="space-between"
				gap="sm"
				wrap="nowrap"
			>
				<Text
					fz="sm"
					c="slate"
				>
					{results.length} result{results.length === 1 ? "" : "s"} for "{term}" ·{" "}
					{searchQuery.data.queryMs}ms
				</Text>
				<Button
					size="compact-sm"
					variant="subtle"
					color="slate"
					leftSection={<Icon path={iconArrowLeft} />}
					onClick={onClear}
				>
					Back to all documents
				</Button>
			</Group>
			{results.map((hit, index) => (
				<SearchHit
					key={`${hit.document.id}-${hit.chunk.id}-${index}`}
					hit={hit}
					onOpen={() => openDocument.mutate(hit.document.id)}
					opening={openDocument.isPending && openDocument.variables === hit.document.id}
				/>
			))}
		</Stack>
	);
}

function SearchHit({
	hit,
	onOpen,
	opening,
}: {
	hit: QueryHit;
	onOpen: () => void;
	opening: boolean;
}) {
	return (
		<Paper
			p="md"
			radius="md"
			withBorder
		>
			<Group
				justify="space-between"
				gap="sm"
				wrap="nowrap"
				align="flex-start"
			>
				<Box
					flex={1}
					miw={0}
				>
					<Group
						gap="sm"
						wrap="nowrap"
					>
						<Badge
							variant="light"
							color="violet"
							size="sm"
						>
							{hit.score.toFixed(3)}
						</Badge>
						<Text
							fw={600}
							c="bright"
							truncate
							className="selectable"
						>
							{hit.document.title || hit.document.source || hit.document.id}
						</Text>
					</Group>
					<Text
						fz="sm"
						mt={6}
						lineClamp={3}
						className={`${classes.snippet} selectable`}
					>
						{hit.chunk.text}
					</Text>
				</Box>
				<Button
					size="xs"
					variant="light"
					leftSection={<Icon path={iconEye} />}
					onClick={onOpen}
					loading={opening}
				>
					Open document
				</Button>
			</Group>
		</Paper>
	);
}

/**
 * Search hits only carry a thin document summary, so to open the full inspector
 * we fetch the document's metadata by id first.
 */
function useOpenDocument(client: Spectron, onInspect: (document: DocumentEntry) => void) {
	return useMutation({
		mutationFn: (id: string) => client.documents.get(id),
		onSuccess: (document) => onInspect(document),
		onError: (err) => {
			showErrorNotification({ title: "Couldn't open document", content: err });
		},
	});
}

// ─── Inspector drawer (metadata + paginated chunks) ───

function InspectorDrawer({
	client,
	document: doc,
	onClose,
	onRenamed,
}: {
	client: Spectron;
	document: DocumentEntry | null;
	onClose: () => void;
	onRenamed: (document: DocumentEntry) => void;
}) {
	return (
		<Drawer
			opened={doc !== null}
			onClose={onClose}
			position="right"
			size="lg"
			title={
				<Group
					gap="sm"
					wrap="nowrap"
				>
					{doc && (
						<ThemeIcon
							size={32}
							radius="md"
							variant="light"
							color="violet"
						>
							<Icon path={mimeIcon(doc.mimeType)} />
						</ThemeIcon>
					)}
					<Text
						fw={600}
						c="bright"
						truncate
					>
						{doc?.title || doc?.source || "Document"}
					</Text>
				</Group>
			}
		>
			{doc && (
				// Key by document id so switching documents remounts the body and
				// resets its local state (e.g. chunk pagination). Without this a
				// small document opened after paging deep into a large one would
				// request an out-of-range page and show a misleading "no chunks".
				<InspectorBody
					key={doc.id}
					client={client}
					document={doc}
					onRenamed={onRenamed}
				/>
			)}
		</Drawer>
	);
}

// Editable document name. There is no dedicated rename endpoint, so the only
// way to change the stored title is to reprocess the document — we round-trip
// its existing bytes with the new title. That re-runs the ingestion pipeline,
// so we tell the user the document will be re-processed. (#750)
function DocumentNameField({
	client,
	document: doc,
	onRenamed,
}: {
	client: Spectron;
	document: DocumentEntry;
	onRenamed: (document: DocumentEntry) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState(doc.title ?? "");

	// Re-sync the field whenever the inspected document's title changes.
	useEffect(() => {
		setTitle(doc.title ?? "");
		setEditing(false);
	}, [doc.title]);

	const rename = useMutation({
		mutationFn: async (nextTitle: string) => {
			const bytes = await client.documents.raw(doc.id);
			await client.documents.reprocess(doc.id, {
				file: new Blob([bytes], {
					type: doc.mimeType || "application/octet-stream",
				}),
				filename: doc.source || doc.title || doc.id,
				title: nextTitle,
				contentType: doc.mimeType || undefined,
			});
			return client.documents.get(doc.id);
		},
		onSuccess: (updated) => {
			onRenamed(updated);
			setEditing(false);
			showInfo({
				title: "Document renamed",
				subtitle: "Spectron is re-processing it under the new name.",
			});
		},
		onError: (err) => {
			showErrorNotification({ title: "Couldn't rename document", content: err });
		},
	});

	const trimmed = title.trim();
	const canSave = trimmed.length > 0 && trimmed !== (doc.title ?? "") && !rename.isPending;

	const cancel = () => {
		setTitle(doc.title ?? "");
		setEditing(false);
	};

	if (!editing) {
		return (
			<Group
				gap="xs"
				wrap="nowrap"
				align="center"
			>
				<Text
					fw={600}
					c="bright"
					flex={1}
					truncate
					className="selectable"
				>
					{doc.title || doc.source || "Untitled document"}
				</Text>
				<Tooltip label="Rename">
					<ActionIcon
						variant="subtle"
						color="slate"
						size="sm"
						aria-label="Rename document"
						onClick={() => setEditing(true)}
					>
						<Icon path={iconEdit} />
					</ActionIcon>
				</Tooltip>
			</Group>
		);
	}

	return (
		<Stack gap={4}>
			<Group
				gap="xs"
				wrap="nowrap"
				align="center"
			>
				<TextInput
					flex={1}
					value={title}
					autoFocus
					disabled={rename.isPending}
					aria-label="Document name"
					onChange={(event) => setTitle(event.currentTarget.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && canSave) {
							event.preventDefault();
							rename.mutate(trimmed);
						} else if (event.key === "Escape") {
							event.preventDefault();
							cancel();
						}
					}}
				/>
				<Tooltip label="Save">
					<ActionIcon
						variant="light"
						color="green"
						aria-label="Save name"
						disabled={!canSave}
						loading={rename.isPending}
						onClick={() => rename.mutate(trimmed)}
					>
						<Icon path={iconCheck} />
					</ActionIcon>
				</Tooltip>
				<Tooltip label="Cancel">
					<ActionIcon
						variant="subtle"
						color="slate"
						aria-label="Cancel rename"
						disabled={rename.isPending}
						onClick={cancel}
					>
						<Icon path={iconClose} />
					</ActionIcon>
				</Tooltip>
			</Group>
			<Text
				fz="xs"
				c="slate"
			>
				Renaming re-processes the document so retrieval stays in sync.
			</Text>
		</Stack>
	);
}

function InspectorBody({
	client,
	document: doc,
	onRenamed,
}: {
	client: Spectron;
	document: DocumentEntry;
	onRenamed: (document: DocumentEntry) => void;
}) {
	const [chunkPage, setChunkPage] = useState(1);
	// Default to the readable, reconstructed document; the raw chunk view is
	// opt-in for when the retrieval boundaries themselves matter. (#16)
	const [view, setView] = useState<"document" | "chunks">("document");

	const chunksQuery = useQuery({
		queryKey: ["spectron", client.contextId, "documents", "chunks", doc.id, chunkPage],
		queryFn: () =>
			// Mantine's Pagination is 1-based; the API expects a 0-indexed page.
			client.documents.chunks(doc.id, { page: chunkPage - 1, pageSize: CHUNK_PAGE_SIZE }),
		retry: false,
		placeholderData: (prev) => prev,
		enabled: doc.status === "ready",
	});

	const totalChunks = chunksQuery.data?.total ?? 0;
	const documentChunkCount = Math.min(totalChunks, DOCUMENT_VIEW_CHUNK_CAP);

	// The reconstructed view needs every chunk, so it pulls them in one page
	// (capped) rather than reusing the small paginated request above. Only runs
	// when that view is actually shown.
	const documentQuery = useQuery({
		queryKey: ["spectron", client.contextId, "documents", "full", doc.id, documentChunkCount],
		queryFn: () => client.documents.chunks(doc.id, { page: 0, pageSize: documentChunkCount }),
		retry: false,
		enabled: doc.status === "ready" && view === "document" && totalChunks > 0,
	});

	const documentText = useMemo(
		() => (documentQuery.data ? reconstructDocument(documentQuery.data.chunks) : ""),
		[documentQuery.data],
	);

	const chunkPageCount = chunksQuery.data
		? Math.max(1, Math.ceil(chunksQuery.data.total / CHUNK_PAGE_SIZE))
		: 1;

	return (
		<Stack gap="lg">
			<DocumentNameField
				client={client}
				document={doc}
				onRenamed={onRenamed}
			/>

			<Stack gap={6}>
				<MetaRow label="Status">
					<StatusBadge
						status={doc.status}
						error={doc.error}
					/>
				</MetaRow>
				<MetaRow
					label="Source"
					value={doc.source}
					mono
				/>
				<MetaRow
					label="MIME type"
					value={doc.mimeType}
					mono
				/>
				<MetaRow
					label="Size"
					value={formatFileSize(doc.sizeBytes)}
				/>
				<MetaRow
					label="Chunks"
					value={chunksQuery.data ? chunksQuery.data.total.toLocaleString() : "—"}
				/>
				<MetaRow
					label="Created"
					value={formatDate(doc.createdAt)}
				/>
				<MetaRow
					label="Updated"
					value={formatDate(doc.updatedAt)}
				/>
				<MetaRow
					label="Content hash"
					value={doc.contentHash}
					mono
				/>
			</Stack>

			{doc.status === "failed" && doc.error && (
				<PageError
					title="Processing failed"
					message={doc.error}
				/>
			)}

			<Group
				justify="space-between"
				align="center"
				gap="sm"
				wrap="nowrap"
			>
				<Text
					fw={600}
					c="bright"
					fz="sm"
				>
					Content
				</Text>
				{doc.status === "ready" && totalChunks > 0 && (
					<SegmentedControl
						size="xs"
						value={view}
						onChange={(value) => setView(value as "document" | "chunks")}
						data={[
							{ label: "Document", value: "document" },
							{ label: "Chunks", value: "chunks" },
						]}
					/>
				)}
			</Group>

			{doc.status !== "ready" ? (
				<Text
					fz="sm"
					c="slate"
				>
					Content becomes available once processing completes.
				</Text>
			) : view === "document" ? (
				<DocumentContent
					// Combine both queries: the chunk count comes from chunksQuery,
					// then documentQuery pulls the full text. Treat either loading
					// or failing as the document view's state so the count isn't
					// momentarily read as zero ("no chunks") before it resolves.
					isLoading={chunksQuery.isPending || documentQuery.isLoading}
					isError={chunksQuery.isError || documentQuery.isError}
					errorMessage={
						chunksQuery.error instanceof Error
							? chunksQuery.error.message
							: documentQuery.error instanceof Error
								? documentQuery.error.message
								: undefined
					}
					onRetry={() => {
						chunksQuery.refetch();
						documentQuery.refetch();
					}}
					text={documentText}
					totalChunks={totalChunks}
					shownChunks={documentChunkCount}
					onViewChunks={() => setView("chunks")}
				/>
			) : chunksQuery.isPending ? (
				<Stack gap="sm">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton
							key={i}
							h={72}
							radius="sm"
						/>
					))}
				</Stack>
			) : chunksQuery.isError ? (
				<PageError
					title="Couldn't load chunks"
					message={
						chunksQuery.error instanceof Error ? chunksQuery.error.message : undefined
					}
					onRetry={() => chunksQuery.refetch()}
				/>
			) : chunksQuery.data.chunks.length === 0 ? (
				<Text
					fz="sm"
					c="slate"
				>
					This document has no chunks.
				</Text>
			) : (
				<Stack gap="sm">
					{chunksQuery.data.chunks.map((chunk) => (
						<Paper
							key={chunk.id}
							p="sm"
							radius="sm"
							withBorder
						>
							<Group
								gap="xs"
								mb={6}
							>
								<Badge size="xs">#{chunk.position}</Badge>
								{chunk.section && (
									<Text
										fz="xs"
										c="slate"
										truncate
									>
										{chunk.section}
									</Text>
								)}
								{chunk.tokenCount != null && (
									<Text
										fz="xs"
										c="slate"
										ml="auto"
									>
										{chunk.tokenCount} tokens
									</Text>
								)}
							</Group>
							<Text
								fz="sm"
								lineClamp={6}
								className="selectable"
								style={{ whiteSpace: "pre-wrap" }}
							>
								{chunk.text}
							</Text>
						</Paper>
					))}
					{chunkPageCount > 1 && (
						<Group
							justify="center"
							mt="xs"
						>
							<Pagination
								size="sm"
								total={chunkPageCount}
								value={chunkPage}
								onChange={setChunkPage}
							/>
						</Group>
					)}
				</Stack>
			)}
		</Stack>
	);
}

/** Renders the reconstructed, continuous document text for the "Document" view. */
function DocumentContent({
	isLoading,
	isError,
	errorMessage,
	onRetry,
	text,
	totalChunks,
	shownChunks,
	onViewChunks,
}: {
	isLoading: boolean;
	isError: boolean;
	errorMessage?: string;
	onRetry: () => void;
	text: string;
	totalChunks: number;
	shownChunks: number;
	onViewChunks: () => void;
}) {
	if (isLoading) {
		return (
			<Stack gap="sm">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={i}
						h={20}
						radius="sm"
					/>
				))}
			</Stack>
		);
	}

	if (isError) {
		return (
			<PageError
				title="Couldn't load document"
				message={errorMessage}
				onRetry={onRetry}
			/>
		);
	}

	if (totalChunks === 0) {
		return (
			<Text
				fz="sm"
				c="slate"
			>
				This document has no chunks.
			</Text>
		);
	}

	const truncated = shownChunks < totalChunks;

	return (
		<Stack gap="xs">
			<Paper
				p="md"
				radius="sm"
				withBorder
			>
				<Text
					fz="sm"
					className="selectable"
					style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
				>
					{text}
				</Text>
			</Paper>
			{truncated && (
				<Text
					fz="xs"
					c="slate"
				>
					Showing the first {shownChunks.toLocaleString()} of{" "}
					{totalChunks.toLocaleString()} chunks.{" "}
					<UnstyledButton
						component="span"
						onClick={onViewChunks}
						style={{ textDecoration: "underline", fontSize: "inherit" }}
					>
						Switch to Chunks
					</UnstyledButton>{" "}
					to browse the rest.
				</Text>
			)}
		</Stack>
	);
}

function MetaRow({
	label,
	value,
	mono,
	children,
}: {
	label: string;
	value?: string;
	mono?: boolean;
	children?: React.ReactNode;
}) {
	return (
		<Group
			gap="md"
			wrap="nowrap"
			align="flex-start"
		>
			<Text
				fz="xs"
				c="slate"
				w={110}
				style={{ flexShrink: 0 }}
			>
				{label}
			</Text>
			{children ?? (
				<Text
					fz="sm"
					c="bright"
					className={mono ? `${classes.mono} selectable` : "selectable"}
					style={{ wordBreak: "break-word" }}
				>
					{value}
				</Text>
			)}
		</Group>
	);
}

// ─── Upload modal ───

type UploadState = "pending" | "uploading" | "done" | "failed";

interface UploadItem {
	file: File;
	state: UploadState;
	deduplicated?: boolean;
	error?: string;
}

// ─── Scope selector (DNF) ───

/**
 * Builds a DNF scope selector to narrow a document's visibility. Each "set" is a
 * space-separated list of scope paths that are ANDed together; the sets are ORed.
 * e.g. set 1 `org/apple` + set 2 `team/x clearance/secret` ⇒
 * `"org/apple" OR ("team/x" AND "clearance/secret")`. Empty inherits the
 * uploader's full write region.
 */
/** Splits the free-text scope draft into a deduped set of AND-ed paths. */
function parseScopeDraft(draft: string): string[] {
	return Array.from(new Set(draft.trim().split(/\s+/).filter(Boolean)));
}

function ScopeSetsField({
	value,
	onChange,
	draft,
	onDraftChange,
	availableScopes,
	onRegister,
	registering,
	error,
	onError,
	disabled,
}: {
	value: SpectronScopeSets;
	onChange: (value: SpectronScopeSets) => void;
	draft: string;
	onDraftChange: (value: string) => void;
	availableScopes: string[];
	onRegister: (paths: string[]) => void;
	registering: boolean;
	error: string | null;
	onError: (message: string | null) => void;
	disabled?: boolean;
}) {
	const known = useMemo(() => new Set(availableScopes), [availableScopes]);

	// Well-formed paths typed in the field that aren't registered yet — these are
	// the ones the inline "Register" affordance offers to create. (#745)
	const unknownPaths =
		availableScopes.length > 0
			? parseScopeDraft(draft).filter((p) => validateScopePath(p) === null && !known.has(p))
			: [];

	const addSet = () => {
		const paths = parseScopeDraft(draft);
		if (paths.length === 0) return;

		const formatError = paths.map(validateScopePath).find((e): e is string => e !== null);
		if (formatError) {
			onError(formatError);
			return;
		}

		// Reject scopes that aren't registered so a document isn't pinned to a
		// scope that doesn't exist. (#736)
		if (availableScopes.length > 0) {
			const missing = paths.filter((p) => !known.has(p));
			if (missing.length > 0) {
				onError(
					`Unknown scope${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Register ${missing.length > 1 ? "them" : "it"} or pick a suggestion.`,
				);
				return;
			}
		}

		onChange([...value, paths]);
		onDraftChange("");
		onError(null);
	};

	const removeSet = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const removePath = (setIndex: number, pathIndex: number) => {
		const next = value
			.map((set, i) => (i === setIndex ? set.filter((_, j) => j !== pathIndex) : set))
			.filter((set) => set.length > 0);
		onChange(next);
	};

	const expression = value
		.map((set) =>
			set.length > 1 ? `(${set.map((p) => `"${p}"`).join(" AND ")})` : `"${set[0]}"`,
		)
		.join(" OR ");

	return (
		<Stack gap="xs">
			<Box>
				<Text
					fz="sm"
					fw={500}
					c="bright"
				>
					Limit visibility (optional)
				</Text>
				<Text
					fz="xs"
					c="slate"
				>
					Add one or more scope sets to narrow who can see this document. Paths within a
					set are ANDed; each set is ORed. Leave empty to inherit your full write region.
				</Text>
			</Box>

			<Group
				gap="xs"
				wrap="nowrap"
				align="flex-end"
			>
				<Autocomplete
					flex={1}
					label="Scope set"
					placeholder="e.g. team/x clearance/secret"
					value={draft}
					data={availableScopes}
					disabled={disabled}
					onChange={(val) => {
						onDraftChange(val);
						if (error) {
							onError(null);
						}
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							addSet();
						}
					}}
				/>
				<Button
					variant="light"
					onClick={addSet}
					disabled={disabled || draft.trim().length === 0}
				>
					Add set
				</Button>
			</Group>

			{error && (
				<Group
					gap="xs"
					wrap="nowrap"
					align="center"
				>
					<Text
						fz="xs"
						c="red"
						flex={1}
					>
						{error}
					</Text>
					{unknownPaths.length > 0 && (
						<Button
							size="compact-xs"
							variant="subtle"
							leftSection={<Icon path={iconFolderPlus} />}
							loading={registering}
							disabled={disabled}
							onClick={() => onRegister(unknownPaths)}
						>
							{unknownPaths.length > 1
								? `Register ${unknownPaths.length} scopes`
								: `Register "${unknownPaths[0]}"`}
						</Button>
					)}
				</Group>
			)}

			{value.length > 0 && (
				<Stack gap={4}>
					{value.map((set, setIndex) => (
						<Fragment key={setIndex}>
							{setIndex > 0 && (
								<Text
									fz={11}
									fw={500}
									c="slate"
									ta="center"
									style={{ letterSpacing: "0.08em" }}
								>
									OR
								</Text>
							)}
							<Paper
								radius="sm"
								withBorder
								px="xs"
								py={4}
							>
								<Group
									gap="xs"
									wrap="nowrap"
									align="center"
								>
									<Group
										gap={6}
										flex={1}
									>
										{set.map((path, pathIndex) => (
											<Badge
												key={pathIndex}
												variant="light"
												color="violet"
												tt="none"
												rightSection={
													disabled ? undefined : (
														<CloseButton
															size={14}
															aria-label={`Remove ${path}`}
															onClick={() =>
																removePath(setIndex, pathIndex)
															}
														/>
													)
												}
											>
												{path}
											</Badge>
										))}
									</Group>
									<Tooltip label="Remove set">
										<ActionIcon
											variant="subtle"
											color="red"
											size="sm"
											aria-label={`Remove scope set ${setIndex + 1}`}
											disabled={disabled}
											onClick={() => removeSet(setIndex)}
										>
											<Icon path={iconTrash} />
										</ActionIcon>
									</Tooltip>
								</Group>
							</Paper>
						</Fragment>
					))}
					<Text
						fz="xs"
						c="slate"
						ff="monospace"
						style={{ wordBreak: "break-word" }}
					>
						{expression}
					</Text>
				</Stack>
			)}
		</Stack>
	);
}

function UploadModal({
	client,
	opened,
	onClose,
	onUploaded,
}: {
	client: Spectron;
	opened: boolean;
	onClose: () => void;
	onUploaded: () => void;
}) {
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const [items, setItems] = useState<UploadItem[]>([]);
	const [busy, setBusy] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [source, setSource] = useState<"files" | "text">("files");
	const [textName, setTextName] = useState("");
	const [textContent, setTextContent] = useState("");
	const [scopes, setScopes] = useState<SpectronScopeSets>([]);
	const [scopeDraft, setScopeDraft] = useState("");
	const [scopeError, setScopeError] = useState<string | null>(null);

	const scopesQueryKey = ["spectron", client.contextId, "scopes", "list"];

	// Registered scopes power autocomplete + validation in the scope field. (#736, #745)
	const scopesQuery = useQuery({
		queryKey: scopesQueryKey,
		queryFn: () => client.scopes.list(),
		retry: false,
		enabled: opened,
	});

	const availableScopes = useMemo(
		() =>
			(scopesQuery.data ?? [])
				.map((scope) => normalizeScopePath(scope.path))
				.filter((path) => path.length > 0),
		[scopesQuery.data],
	);

	const registerScopes = useMutation({
		mutationFn: async (paths: string[]) => {
			for (const path of paths) {
				await client.scopes.register({ path });
			}
		},
		onSuccess: (_data, paths) => {
			queryClient.invalidateQueries({ queryKey: scopesQueryKey });
			showInfo({
				title: paths.length > 1 ? "Scopes registered" : "Scope registered",
				subtitle: paths.join(", "),
			});
		},
		onError: (err) => {
			showErrorNotification({ title: "Couldn't register scope", content: err });
		},
	});

	// Register the unknown paths, then commit the whole draft as a set. (#745)
	const handleRegisterScopes = async (paths: string[]) => {
		try {
			await registerScopes.mutateAsync(paths);
			setScopes((prev) => [...prev, parseScopeDraft(scopeDraft)]);
			setScopeDraft("");
			setScopeError(null);
		} catch {
			// The mutation already surfaced the error via a notification.
		}
	};

	const reset = () => {
		setItems([]);
		setBusy(false);
		setDragging(false);
		setSource("files");
		setTextName("");
		setTextContent("");
		setScopes([]);
		setScopeDraft("");
		setScopeError(null);
	};

	const handleClose = () => {
		if (busy) return;
		reset();
		onClose();
	};

	// Selecting/dropping files only stages them; the actual upload waits for the
	// explicit "Upload" action so the user can set scopes first.
	const stageFiles = (files: File[]) => {
		if (files.length === 0) return;
		setItems((prev) => [
			...prev,
			...files.map((file): UploadItem => ({ file, state: "pending" })),
		]);
	};

	// Stages pasted text as a named text/plain document, reusing the same upload
	// queue (and scope selection) as file uploads. (#12)
	const stageText = () => {
		const name = textName.trim();
		if (name.length === 0 || textContent.trim().length === 0) return;
		// The explicit contentType drives parsing, so the filename is just a label
		// and doesn't need a forced extension.
		const file = new File([textContent], name, { type: "text/plain" });
		stageFiles([file]);
		setTextName("");
		setTextContent("");
	};

	const removeItem = (index: number) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	const runUploads = async () => {
		// Upload everything not already uploaded — staged files, plus any that
		// failed (so the button retries them).
		const queue = items
			.map((item, index) => ({ item, index }))
			.filter(({ item }) => item.state === "pending" || item.state === "failed");
		if (queue.length === 0) return;

		// Auto-commit any text still in the scope field so the user doesn't have to
		// click "Add set" before uploading. (#745)
		const scopeSets = scopeDraft.trim() ? [...scopes, parseScopeDraft(scopeDraft)] : scopes;

		// Reject unknown scopes up front so the failure is loud and explained here
		// rather than a silent per-file server rejection. (#736)
		if (availableScopes.length > 0) {
			const known = new Set(availableScopes);
			const unknown = Array.from(new Set(scopeSets.flat())).filter((p) => !known.has(p));
			if (unknown.length > 0) {
				setScopeError(
					`Unknown scope${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. Register ${unknown.length > 1 ? "them" : "it"}, or pick from the suggestions, before uploading.`,
				);
				return;
			}
		}
		setScopeError(null);

		// Reflect the committed draft in the visible chips.
		if (scopeDraft.trim()) {
			setScopes(scopeSets);
			setScopeDraft("");
		}

		setBusy(true);

		const update = (index: number, patch: Partial<UploadItem>) => {
			setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
		};

		let anySucceeded = false;
		let anyFailed = false;

		for (const { item, index } of queue) {
			update(index, { state: "uploading", error: undefined });
			try {
				const result = await client.documents.upload({
					file: item.file,
					filename: item.file.name,
					title: item.file.name,
					contentType: item.file.type || undefined,
					scopes: scopeSets.length > 0 ? scopeSets : undefined,
				});
				update(index, { state: "done", deduplicated: result.deduplicated });
				anySucceeded = true;
			} catch (err) {
				update(index, {
					state: "failed",
					error: err instanceof Error ? err.message : String(err),
				});
				anyFailed = true;
			}
		}

		setBusy(false);

		if (anyFailed) {
			showErrorNotification({
				title: "Some uploads failed",
				content: new Error("See the highlighted files below for details."),
			});
		}

		if (anySucceeded) {
			onUploaded();
			showInfo({
				title: "Upload complete",
				subtitle: "Spectron is processing your documents.",
			});
			// Auto-close once everything uploaded cleanly. (#735)
			if (!anyFailed) {
				handleClose();
			}
		}
	};

	const handleFiles = (fileList: FileList | null) => {
		if (!fileList) return;
		stageFiles(Array.from(fileList));
	};

	const onDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setDragging(false);
		stageFiles(Array.from(event.dataTransfer.files));
	};

	const pendingCount = items.filter(
		(item) => item.state === "pending" || item.state === "failed",
	).length;

	return (
		<Drawer
			opened={opened}
			onClose={handleClose}
			position="right"
			size="md"
			title={<Text fw={600}>Upload documents</Text>}
		>
			<Stack gap="md">
				<input
					ref={inputRef}
					type="file"
					multiple
					hidden
					onChange={(event) => {
						handleFiles(event.currentTarget.files);
						event.currentTarget.value = "";
					}}
				/>

				<SegmentedControl
					fullWidth
					value={source}
					onChange={(value) => setSource(value as "files" | "text")}
					disabled={busy}
					data={[
						{ label: "Upload files", value: "files" },
						{ label: "Paste text", value: "text" },
					]}
				/>

				{source === "files" ? (
					<UnstyledButton
						onClick={() => inputRef.current?.click()}
						onDragOver={(event) => {
							event.preventDefault();
							setDragging(true);
						}}
						onDragLeave={() => setDragging(false)}
						onDrop={onDrop}
						className={classes.dropZone}
						data-dragging={dragging || undefined}
					>
						<Stack
							gap="xs"
							align="center"
						>
							<ThemeIcon
								size={48}
								radius="xl"
								variant="light"
								color="violet"
							>
								<Icon
									path={iconUpload}
									size="xl"
								/>
							</ThemeIcon>
							<Text
								fw={600}
								c="bright"
							>
								Drop files here or click to choose
							</Text>
							<Text
								fz="sm"
								c="slate"
								ta="center"
							>
								PDF, Markdown, JSON, HTML, plain text, and more. You can add several
								at once.
							</Text>
						</Stack>
					</UnstyledButton>
				) : (
					<Stack gap="xs">
						<TextInput
							label="Name"
							placeholder="e.g. meeting-notes"
							value={textName}
							disabled={busy}
							onChange={(event) => setTextName(event.currentTarget.value)}
						/>
						<Textarea
							label="Text"
							placeholder="Paste or type the document text…"
							value={textContent}
							disabled={busy}
							autosize
							minRows={6}
							maxRows={16}
							onChange={(event) => setTextContent(event.currentTarget.value)}
						/>
						<Group justify="flex-end">
							<Button
								variant="light"
								leftSection={<Icon path={iconText} />}
								onClick={stageText}
								disabled={
									busy ||
									textName.trim().length === 0 ||
									textContent.trim().length === 0
								}
							>
								Add text document
							</Button>
						</Group>
					</Stack>
				)}

				{items.length > 0 && (
					<Stack gap="xs">
						{items.map((item, index) => (
							<UploadRow
								key={`${item.file.name}-${index}`}
								item={item}
								onRemove={
									busy || item.state === "uploading" || item.state === "done"
										? undefined
										: () => removeItem(index)
								}
							/>
						))}
					</Stack>
				)}

				{items.some((item) => item.state === "failed") && (
					<Alert
						color="red"
						variant="light"
						icon={<Icon path={iconWarning} />}
						title="Some uploads failed"
					>
						<Stack gap={4}>
							{items
								.filter((item) => item.state === "failed")
								.map((item, idx) => (
									<Text
										key={`${item.file.name}-${idx}`}
										fz="sm"
										className="selectable"
									>
										<b>{item.file.name}</b>: {item.error ?? "Upload failed"}
									</Text>
								))}
						</Stack>
					</Alert>
				)}

				<ScopeSetsField
					value={scopes}
					onChange={setScopes}
					draft={scopeDraft}
					onDraftChange={setScopeDraft}
					availableScopes={availableScopes}
					onRegister={handleRegisterScopes}
					registering={registerScopes.isPending}
					error={scopeError}
					onError={setScopeError}
					disabled={busy}
				/>

				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="slate"
						onClick={handleClose}
						disabled={busy}
					>
						{items.some((item) => item.state === "done") ? "Done" : "Cancel"}
					</Button>
					{source === "files" && (
						<Button
							leftSection={<Icon path={iconUpload} />}
							onClick={() => inputRef.current?.click()}
							disabled={busy}
						>
							Add files
						</Button>
					)}
					<Button
						variant="gradient"
						onClick={runUploads}
						loading={busy}
						disabled={pendingCount === 0}
					>
						{pendingCount > 0
							? `Upload ${pendingCount} file${pendingCount === 1 ? "" : "s"}`
							: "Upload"}
					</Button>
				</Group>
			</Stack>
		</Drawer>
	);
}

function UploadRow({ item, onRemove }: { item: UploadItem; onRemove?: () => void }) {
	return (
		<Paper
			p="xs"
			radius="sm"
			withBorder
		>
			<Group
				gap="sm"
				wrap="nowrap"
			>
				<Icon
					path={mimeIcon(item.file.type)}
					c="slate"
				/>
				<Box
					flex={1}
					miw={0}
				>
					<Text
						fz="sm"
						c="bright"
						truncate
						title={item.file.name}
					>
						{item.file.name}
					</Text>
					<Text
						fz="xs"
						c="slate"
					>
						{formatFileSize(item.file.size)}
					</Text>
				</Box>
				<UploadStatus item={item} />
				{onRemove && (
					<CloseButton
						size="sm"
						aria-label={`Remove ${item.file.name}`}
						onClick={onRemove}
					/>
				)}
			</Group>
		</Paper>
	);
}

function UploadStatus({ item }: { item: UploadItem }) {
	if (item.state === "uploading") {
		return <Loader size="xs" />;
	}
	if (item.state === "done") {
		return item.deduplicated ? (
			<Badge
				variant="light"
				color="blue"
				size="sm"
			>
				Deduplicated
			</Badge>
		) : (
			<Badge
				variant="light"
				color="green"
				size="sm"
			>
				Uploaded
			</Badge>
		);
	}
	if (item.state === "failed") {
		return (
			<Tooltip
				label={item.error || "Upload failed"}
				multiline
				maw={260}
			>
				<Badge
					variant="light"
					color="red"
					size="sm"
				>
					Failed
				</Badge>
			</Tooltip>
		);
	}
	return <Badge size="sm">Pending</Badge>;
}

// ─── Helpers ───

function formatDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
