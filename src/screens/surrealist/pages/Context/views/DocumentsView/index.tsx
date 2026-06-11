import {
	ActionIcon,
	Badge,
	Box,
	Button,
	CloseButton,
	Divider,
	Drawer,
	Group,
	Loader,
	Pagination,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Spectron } from "@surrealdb/spectron";
import {
	Icon,
	iconBraces,
	iconEye,
	iconFile,
	iconImage,
	iconSearch,
	iconText,
	iconTrash,
	iconUpload,
	pictoDocument,
} from "@surrealdb/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { formatFileSize, showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../components/ContextHero";
import { EmptyState, PageError, SpectronGate } from "../../components/feedback";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

// The SDK doesn't export the per-document JSON shape as a public alias, so we
// infer it from the list response (a paginated `DocumentJson[]`).
type DocumentEntry = Awaited<ReturnType<Spectron["documents"]["list"]>>["documents"][number];
type DocumentStatus = DocumentEntry["status"];
type QueryHit = Awaited<ReturnType<Spectron["documents"]["query"]>>["results"][number];

const PAGE_SIZE = 24;
const CHUNK_PAGE_SIZE = 10;
const POLL_INTERVAL = 3000;

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
				description="Ground your agent in real source material. Upload files and Spectron parses, chunks, embeds, and links them so retrieval can cite the exact passage it came from."
				art={pictoDocument}
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
		queryFn: () => client.documents.list({ page, pageSize: PAGE_SIZE }),
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
								onDelete={() => deleteMutation.mutate(doc.id)}
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
		<Paper
			p="md"
			radius="md"
			withBorder
			className={classes.fileCard}
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
					<Text
						fw={600}
						c="bright"
						truncate
						title={fileName}
						className="selectable"
					>
						{fileName}
					</Text>
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
					{doc.status === "ready" && (
						<Text
							fz="xs"
							c="slate"
							mt={4}
						>
							{(doc.chunkCount ?? 0).toLocaleString()} chunks
							{doc.keywordCount != null &&
								` · ${doc.keywordCount.toLocaleString()} keywords`}
						</Text>
					)}
					<Text
						fz="xs"
						c="slate"
						mt={2}
					>
						{formatDate(doc.createdAt)}
					</Text>
				</Box>
				<Stack gap={4}>
					<Tooltip label="Inspect">
						<ActionIcon
							variant="subtle"
							color="slate"
							size="sm"
							aria-label={`Inspect ${fileName}`}
							onClick={onInspect}
						>
							<Icon path={iconEye} />
						</ActionIcon>
					</Tooltip>
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
				</Stack>
			</Group>
		</Paper>
	);
}

// ─── Search mode ───

function SearchResults({
	client,
	term,
	onInspect,
}: {
	client: Spectron;
	term: string;
	onInspect: (document: DocumentEntry) => void;
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
			/>
		);
	}

	return (
		<Stack gap="sm">
			<Text
				fz="sm"
				c="slate"
			>
				{results.length} result{results.length === 1 ? "" : "s"} ·{" "}
				{searchQuery.data.queryMs}ms
			</Text>
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
}: {
	client: Spectron;
	document: DocumentEntry | null;
	onClose: () => void;
}) {
	const [chunkPage, setChunkPage] = useState(1);

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
				<InspectorBody
					client={client}
					document={doc}
					chunkPage={chunkPage}
					onChunkPageChange={setChunkPage}
				/>
			)}
		</Drawer>
	);
}

function InspectorBody({
	client,
	document: doc,
	chunkPage,
	onChunkPageChange,
}: {
	client: Spectron;
	document: DocumentEntry;
	chunkPage: number;
	onChunkPageChange: (page: number) => void;
}) {
	const chunksQuery = useQuery({
		queryKey: ["spectron", client.contextId, "documents", "chunks", doc.id, chunkPage],
		queryFn: () =>
			client.documents.chunks(doc.id, { page: chunkPage, pageSize: CHUNK_PAGE_SIZE }),
		retry: false,
		placeholderData: (prev) => prev,
		enabled: doc.status === "ready",
	});

	const chunkPageCount = chunksQuery.data
		? Math.max(1, Math.ceil(chunksQuery.data.total / CHUNK_PAGE_SIZE))
		: 1;

	return (
		<Stack gap="lg">
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
				{doc.language && (
					<MetaRow
						label="Language"
						value={doc.language}
					/>
				)}
				<MetaRow
					label="Chunks"
					value={(doc.chunkCount ?? 0).toLocaleString()}
				/>
				<MetaRow
					label="Keywords"
					value={(doc.keywordCount ?? 0).toLocaleString()}
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

			<Divider
				label="Chunks"
				labelPosition="left"
			/>

			{doc.status !== "ready" ? (
				<Text
					fz="sm"
					c="slate"
				>
					Chunks become available once processing completes.
				</Text>
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
								<Badge
									variant="default"
									size="xs"
								>
									#{chunk.position}
								</Badge>
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
								onChange={onChunkPageChange}
							/>
						</Group>
					)}
				</Stack>
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
	const inputRef = useRef<HTMLInputElement>(null);
	const [items, setItems] = useState<UploadItem[]>([]);
	const [busy, setBusy] = useState(false);
	const [dragging, setDragging] = useState(false);

	const reset = () => {
		setItems([]);
		setBusy(false);
		setDragging(false);
	};

	const handleClose = () => {
		if (busy) return;
		reset();
		onClose();
	};

	const runUploads = async (files: File[]) => {
		if (files.length === 0) return;

		const queued: UploadItem[] = files.map((file) => ({ file, state: "pending" }));
		const startIndex = items.length;
		setItems((prev) => [...prev, ...queued]);
		setBusy(true);

		const update = (index: number, patch: Partial<UploadItem>) => {
			setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
		};

		let anySucceeded = false;

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const itemIndex = startIndex + i;
			update(itemIndex, { state: "uploading" });
			try {
				const result = await client.documents.upload({
					file,
					filename: file.name,
					title: file.name,
					contentType: file.type || undefined,
				});
				update(itemIndex, { state: "done", deduplicated: result.deduplicated });
				anySucceeded = true;
			} catch (err) {
				update(itemIndex, {
					state: "failed",
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}

		setBusy(false);

		if (anySucceeded) {
			onUploaded();
			showInfo({
				title: "Upload complete",
				subtitle: "Spectron is processing your documents.",
			});
		}
	};

	const handleFiles = (fileList: FileList | null) => {
		if (!fileList) return;
		runUploads(Array.from(fileList));
	};

	const onDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setDragging(false);
		runUploads(Array.from(event.dataTransfer.files));
	};

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
							PDF, Markdown, JSON, HTML, plain text, and more. Multiple files are
							supported.
						</Text>
					</Stack>
				</UnstyledButton>

				{items.length > 0 && (
					<Stack gap="xs">
						{items.map((item, index) => (
							<UploadRow
								key={`${item.file.name}-${index}`}
								item={item}
							/>
						))}
					</Stack>
				)}

				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="slate"
						onClick={handleClose}
						disabled={busy}
					>
						{items.some((item) => item.state === "done") ? "Done" : "Cancel"}
					</Button>
					<Button
						variant="gradient"
						leftSection={<Icon path={iconUpload} />}
						onClick={() => inputRef.current?.click()}
						loading={busy}
					>
						Choose files
					</Button>
				</Group>
			</Stack>
		</Drawer>
	);
}

function UploadRow({ item }: { item: UploadItem }) {
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
	return (
		<Badge
			variant="default"
			size="sm"
		>
			Pending
		</Badge>
	);
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
