import {
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Transition,
} from "@mantine/core";
import {
	CodeBlock,
	Icon,
	iconArrowLeft,
	iconArrowUpRight,
	iconBook,
	iconCheck,
	iconChevronLeft,
	iconClose,
	iconDownload,
} from "@surrealdb/ui";
import { useMemo } from "react";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { RecordLink } from "~/components/RecordLink";
import { Spacer } from "~/components/Spacer";
import { SURQL_FILTER } from "~/constants";
import { useIsLight } from "~/hooks/theme";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import { MigrationKind, MigrationResourceType, MigrationSeverity } from "~/types";
import { kindMeta } from "../MigrationView/kinds";
import { DiagnosticEntry, DiagnosticResource } from "../MigrationView/organizer";
import { severityMeta } from "../MigrationView/severities";
import { resourceTypeMeta } from "../MigrationView/types";
import { UnresolvedBadge } from "../MigrationView/unresolved";
import classes from "./styles.module.scss";

const SEVERITY_ORDER: MigrationSeverity[] = ["will_break", "can_break", "unlikely_break"];

interface GroupedKindEntry {
	kind: MigrationKind;
	entries: DiagnosticEntry[];
	worstSeverity: MigrationSeverity;
}

function groupEntriesByKind(entries: DiagnosticEntry[]): GroupedKindEntry[] {
	const kindMap = new Map<MigrationKind, GroupedKindEntry>();

	for (const entry of entries) {
		const kind = entry.source.kind;

		if (!kindMap.has(kind)) {
			kindMap.set(kind, {
				kind,
				entries: [],
				worstSeverity: "unlikely_break",
			});
		}

		const group = kindMap.get(kind);

		if (group) {
			group.entries.push(entry);

			const severity = entry.source.severity;

			if (SEVERITY_ORDER.indexOf(severity) < SEVERITY_ORDER.indexOf(group.worstSeverity)) {
				group.worstSeverity = severity;
			}
		}
	}

	return Array.from(kindMap.values());
}

export interface ResourceDetailPanelProps {
	type: MigrationResourceType;
	resource: DiagnosticResource;
	resolvedIds: Set<string>;
	unresolvedIssues: number;
	onBack: () => void;
	onToggleResolved: (entryId: string) => void;
}

export function ResourceDetailPanel({
	type,
	resource,
	resolvedIds,
	unresolvedIssues,
	onBack,
	onToggleResolved,
}: ResourceDetailPanelProps) {
	const isLight = useIsLight();
	const isRecordType = type === "db-tb-record";

	const meta = resourceTypeMeta[type];
	const unresolvedCount = resource.entries.filter((e) => !resolvedIds.has(e.id)).length;

	// Group entries by kind for record types
	const groupedByKind = useMemo(() => {
		if (!isRecordType) return null;
		return groupEntriesByKind(resource.entries);
	}, [isRecordType, resource.entries]);

	const handleToggleAllInGroup = (entries: DiagnosticEntry[]) => {
		const allResolved = entries.every((entry) => resolvedIds.has(entry.id));

		for (const entry of entries) {
			if (allResolved) {
				if (resolvedIds.has(entry.id)) {
					onToggleResolved(entry.id);
				}
			} else {
				if (!resolvedIds.has(entry.id)) {
					onToggleResolved(entry.id);
				}
			}
		}
	};

	const allResolved = useMemo(() => {
		return resource.entries.every((entry) => resolvedIds.has(entry.id));
	}, [resource.entries, resolvedIds]);

	return (
		<Stack h="100%">
			<Paper pos="relative">
				<Group
					px="sm"
					py="xs"
					gap="xs"
					h={48}
					wrap="nowrap"
				>
					<ActionButton
						label="Back to overview"
						mr="sm"
						color="slate"
						variant="light"
						onClick={onBack}
					>
						<Icon path={iconArrowLeft} />
					</ActionButton>
					<Icon
						path={meta.icon}
						c={isLight ? "slate.4" : "slate.3"}
					/>
					<Text
						fw={600}
						c="bright"
						style={{ flexShrink: 0 }}
					>
						{resource.name}
					</Text>
					<UnresolvedBadge count={unresolvedCount} />
				</Group>
			</Paper>
			<Box
				flex={1}
				pos="relative"
			>
				<ScrollArea
					pos="absolute"
					inset={0}
				>
					<Stack
						gap="sm"
						pb="md"
					>
						{isRecordType && groupedByKind
							? groupedByKind.map((group, index) => (
									<GroupedKindCard
										key={group.kind}
										index={index}
										group={group}
										resolvedIds={resolvedIds}
										onToggleAll={() => handleToggleAllInGroup(group.entries)}
									/>
								))
							: resource.entries.map((entry, index) => (
									<EntryCard
										key={entry.id}
										index={index}
										entry={entry}
										isResolved={resolvedIds.has(entry.id)}
										onToggleResolved={() => onToggleResolved(entry.id)}
									/>
								))}

						<Transition mounted={allResolved}>
							{(styles) => (
								<Stack
									mt="xl"
									align="center"
									style={styles}
								>
									<Text>All issues for this resource have been resolved.</Text>
									<Button
										variant="gradient"
										leftSection={
											<Icon
												path={
													unresolvedIssues > 0
														? iconChevronLeft
														: iconCheck
												}
											/>
										}
										onClick={onBack}
									>
										{unresolvedIssues > 0
											? "Back to overview"
											: "Complete migration"}
									</Button>
								</Stack>
							)}
						</Transition>
					</Stack>
				</ScrollArea>
			</Box>
		</Stack>
	);
}

interface EntryCardProps {
	index: number;
	entry: DiagnosticEntry;
	isResolved: boolean;
	onToggleResolved: () => void;
}

function EntryCard({ index, entry, isResolved, onToggleResolved }: EntryCardProps) {
	const { source, record } = entry;
	const severity = severityMeta[source.severity];
	const kind = kindMeta[source.kind];

	console.log(entry);

	const handleOpenDocs = () => {
		if (kind?.documentationUrl) {
			adapter.openUrl(kind.documentationUrl);
		}
	};

	return (
		<Box
			className={classes.entryCard}
			data-resolved={isResolved || undefined}
		>
			<Paper
				p="md"
				radius="md"
				withBorder={false}
			>
				<Stack gap="sm">
					{/* Header with severity and kind */}
					<Group gap="xs">
						<Text
							fw={800}
							c="bright"
							size="md"
						>
							{index + 1}.
						</Text>
						<Text
							fw={600}
							c="bright"
							fz={13}
						>
							{kind.label}
						</Text>
						<Badge
							color={severity.color}
							variant="light"
							size="sm"
						>
							{severity.label}
						</Badge>
						<Spacer />
						{kind?.documentationUrl && (
							<Button
								size="xs"
								color="slate"
								variant="filled"
								leftSection={<Icon path={iconBook} />}
								rightSection={<Icon path={iconArrowUpRight} />}
								onClick={handleOpenDocs}
							>
								Learn more
							</Button>
						)}
						{isResolved ? (
							<Button
								size="xs"
								color="slate"
								variant="light"
								rightSection={<Icon path={iconClose} />}
								onClick={onToggleResolved}
							>
								Mark as unresolved
							</Button>
						) : (
							<Button
								size="xs"
								variant="gradient"
								rightSection={<Icon path={iconCheck} />}
								onClick={onToggleResolved}
							>
								Mark as resolved
							</Button>
						)}
					</Group>

					{/* Error message */}
					<Box>
						{record && (
							<>
								<Text
									fw={600}
									size="sm"
								>
									Affected record:
								</Text>
								<RecordLink value={record} />
								<Divider my="sm" />
							</>
						)}
						<Text
							fw={600}
							size="sm"
						>
							{source.error}
						</Text>
						<Text
							c="dimmed"
							size="sm"
							mt={4}
						>
							{source.details}
						</Text>
					</Box>

					{/* Location info if present */}
					{source.location && (
						<CodeBlock
							value={source.location.source}
							lang="surrealql"
							bg="slate.8"
							p="sm"
						/>
					)}
				</Stack>
			</Paper>
		</Box>
	);
}

interface GroupedKindCardProps {
	index: number;
	group: GroupedKindEntry;
	resolvedIds: Set<string>;
	onToggleAll: () => void;
}

function GroupedKindCard({ index, group, resolvedIds, onToggleAll }: GroupedKindCardProps) {
	const kind = kindMeta[group.kind];
	const severity = severityMeta[group.worstSeverity];
	const unresolvedCount = group.entries.filter((e) => !resolvedIds.has(e.id)).length;
	const allResolved = unresolvedCount === 0;

	const handleOpenDocs = () => {
		if (kind?.documentationUrl) {
			adapter.openUrl(kind.documentationUrl);
		}
	};

	const handleDownloadRecords = async () => {
		const recordIds = group.entries.map((entry) => entry.record).filter(Boolean);
		const surql = await getSurrealQL().formatValue(recordIds, false, true);
		const kindSlug = group.kind.replace(/\s+/g, "-").toLowerCase();

		adapter.saveFile(
			"Save affected records",
			`${kindSlug}-affected-records.surql`,
			[SURQL_FILTER],
			() => surql,
		);
	};

	return (
		<Box
			className={classes.entryCard}
			data-resolved={allResolved || undefined}
		>
			<Paper
				p="md"
				radius="md"
				withBorder={false}
			>
				<Stack gap="sm">
					{/* Header with kind and count */}
					<Group gap="xs">
						<Text
							fw={800}
							c="bright"
							size="md"
						>
							{index + 1}.
						</Text>
						<Text
							fw={600}
							c="bright"
							fz={13}
						>
							{kind.label}
						</Text>
						<Badge
							color={severity.color}
							variant="light"
							size="sm"
						>
							{severity.label}
						</Badge>
						<Badge
							color="slate"
							variant="light"
							size="sm"
						>
							{group.entries.length}{" "}
							{group.entries.length === 1 ? "record" : "records"}
						</Badge>
						<Spacer />
						{kind?.documentationUrl && (
							<Button
								size="xs"
								color="slate"
								variant="light"
								leftSection={<Icon path={iconBook} />}
								rightSection={<Icon path={iconArrowUpRight} />}
								onClick={handleOpenDocs}
							>
								Learn more
							</Button>
						)}
						{allResolved ? (
							<Button
								size="xs"
								color="slate"
								variant="light"
								rightSection={<Icon path={iconClose} />}
								onClick={onToggleAll}
							>
								Mark all as unresolved
							</Button>
						) : (
							<Button
								size="xs"
								variant="gradient"
								rightSection={<Icon path={iconCheck} />}
								onClick={onToggleAll}
							>
								Mark all as resolved
							</Button>
						)}
					</Group>

					{/* Error message */}
					{group.entries[0] && (
						<Box>
							<Text
								fw={600}
								size="sm"
							>
								{group.entries[0].source.error}
							</Text>
							<Text
								c="dimmed"
								size="sm"
								mt={4}
							>
								{group.entries[0].source.details}
							</Text>
						</Box>
					)}

					{/* Download */}
					<Box>
						<Button
							size="xs"
							color="violet"
							variant="light"
							onClick={handleDownloadRecords}
							rightSection={<Icon path={iconDownload} />}
						>
							Download affected record IDs
						</Button>
					</Box>
				</Stack>
			</Paper>
		</Box>
	);
}
