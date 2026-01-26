import { Badge, Box, Button, Divider, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { CodePreview } from "~/components/CodePreview";
import { Icon } from "~/components/Icon";
import { RecordLink } from "~/components/RecordLink";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { MigrationResourceType } from "~/types";
import { iconArrowLeft, iconArrowUpRight, iconBook, iconCheck } from "~/util/icons";
import { kindMeta } from "../MigrationView/kinds";
import { DiagnosticEntry, DiagnosticResource } from "../MigrationView/organizer";
import { severityMeta } from "../MigrationView/severities";
import { resourceTypeMeta } from "../MigrationView/types";
import classes from "./styles.module.scss";

export interface ResourceDetailPanelProps {
	type: MigrationResourceType;
	resource: DiagnosticResource;
	resolvedIds: Set<string>;
	onBack: () => void;
	onToggleResolved: (entryId: string) => void;
}

export function ResourceDetailPanel({
	type,
	resource,
	resolvedIds,
	onBack,
	onToggleResolved,
}: ResourceDetailPanelProps) {
	const isLight = useIsLight();

	const meta = resourceTypeMeta[type];
	const unresolvedCount = resource.entries.filter((e) => !resolvedIds.has(e.id)).length;

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
					<Badge
						color="orange"
						variant="light"
						ml="sm"
						size="sm"
					>
						{unresolvedCount} unresolved
					</Badge>
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
						{resource.entries.map((entry, index) => (
							<EntryCard
								key={entry.id}
								index={index}
								entry={entry}
								isResolved={resolvedIds.has(entry.id)}
								onToggleResolved={() => onToggleResolved(entry.id)}
							/>
						))}
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
								variant="light"
								leftSection={<Icon path={iconBook} />}
								rightSection={<Icon path={iconArrowUpRight} />}
								onClick={handleOpenDocs}
							>
								Learn more
							</Button>
						)}
						<Button
							size="xs"
							variant="gradient"
							disabled={isResolved}
							rightSection={<Icon path={iconCheck} />}
							onClick={onToggleResolved}
						>
							Mark as resolved
						</Button>
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
						// <Box
						// 	p="xs"
						// 	style={{
						// 		backgroundColor: "var(--mantine-color-slate-8)",
						// 		borderRadius: "var(--mantine-radius-sm)",
						// 	}}
						// >
						// 	<Text
						// 		size="xs"
						// 		c="slate"
						// 		mb={4}
						// 	>
						// 		{source.location.label} · Line {source.location.line}, Column{" "}
						// 		{source.location.column}
						// 	</Text>
						// 	{source.location.source && (
						// 		<Text
						// 			size="xs"
						// 			ff="monospace"
						// 			c="bright"
						// 			style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
						// 		>
						// 			{source.location.source}
						// 		</Text>
						// 	)}
						// </Box>
						<CodePreview
							value={source.location.source}
							language="surrealql"
							bg="slate.8"
							withCopy={false}
							withDedent={true}
							padding="sm"
						/>
					)}
				</Stack>
			</Paper>
		</Box>
	);
}
