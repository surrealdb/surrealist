import {
	Accordion,
	Badge,
	Box,
	Button,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconRefresh, iconReset, iconTransfer } from "@surrealdb/ui";
import { useMemo } from "react";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { MigrationResourceType } from "~/types";
import { DiagnosticResource, ResourceMap } from "../MigrationView/organizer";
import { resourceTypeMeta } from "../MigrationView/types";
import { UnresolvedBadge } from "../MigrationView/unresolved";
import classes from "./styles.module.scss";

function countUnresolvedEntries(resource: DiagnosticResource, resolvedIds: Set<string>): number {
	return resource.entries.filter((entry) => !resolvedIds.has(entry.id)).length;
}

export interface ResourceOverviewPanelProps {
	resources: ResourceMap;
	resolvedIds: Set<string>;
	openedTypes: string[];
	onSelectResource: (type: MigrationResourceType, resource: DiagnosticResource) => void;
	onChangeOpenedTypes: (types: string[]) => void;
	onRestart: () => void;
	onRerun: () => void;
	isFetching: boolean;
}

export function ResourceOverviewPanel({
	resources,
	resolvedIds,
	openedTypes,
	onChangeOpenedTypes,
	onSelectResource,
	onRestart,
	onRerun,
	isFetching,
}: ResourceOverviewPanelProps) {
	const isLight = useIsLight();

	// Get resource types that have unresolved entries
	const activeTypes = useMemo(() => {
		return (Object.keys(resources) as MigrationResourceType[]).filter((type) => {
			return resources[type].some(
				(resource) => countUnresolvedEntries(resource, resolvedIds) > 0,
			);
		});
	}, [resources, resolvedIds]);

	// Count total unresolved issues
	const totalIssues = useMemo(() => {
		let count = 0;
		for (const type of Object.keys(resources) as MigrationResourceType[]) {
			for (const resource of resources[type]) {
				count += countUnresolvedEntries(resource, resolvedIds);
			}
		}
		return count;
	}, [resources, resolvedIds]);

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
					<Icon
						path={iconTransfer}
						c={isLight ? "obsidian.4" : "obsidian.3"}
					/>
					<Text
						fw={600}
						c="bright"
						style={{ flexShrink: 0 }}
					>
						Migration Overview
					</Text>
					<Badge
						color="obsidian"
						radius="sm"
					>
						{totalIssues} {totalIssues === 1 ? "issue" : "issues"}
					</Badge>
					<Spacer />
					<Button
						variant="light"
						color="obsidian"
						size="xs"
						onClick={onRestart}
						loading={isFetching}
						rightSection={<Icon path={iconReset} />}
					>
						Start over & check again
					</Button>
					<Button
						variant="gradient"
						size="xs"
						onClick={onRerun}
						loading={isFetching}
						rightSection={<Icon path={iconRefresh} />}
					>
						Check again
					</Button>
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
						gap="xs"
						pb="md"
					>
						{activeTypes.length === 0 ? (
							<Text
								c="obsidian"
								ta="center"
								py="xl"
							>
								No migration issues found
							</Text>
						) : (
							<Accordion
								multiple
								variant="surreal"
								value={openedTypes}
								onChange={onChangeOpenedTypes}
								styles={{
									label: { paddingBlock: 8 },
									control: { paddingLeft: 8 },
								}}
							>
								{activeTypes.map((type) => {
									const meta = resourceTypeMeta[type];
									const typeResources = resources[type].filter(
										(resource) =>
											countUnresolvedEntries(resource, resolvedIds) > 0,
									);

									const typeIssueCount = typeResources.reduce(
										(acc, resource) =>
											acc + countUnresolvedEntries(resource, resolvedIds),
										0,
									);

									return (
										<Accordion.Item
											key={type}
											value={type}
											bg="none"
										>
											<Accordion.Control py={2}>
												<Group gap="sm">
													<Icon path={meta.icon} />
													<Text fw={600}>{meta.label}</Text>
													<Badge
														size="sm"
														color="obsidian"
														variant="light"
														radius="sm"
													>
														{typeIssueCount}
													</Badge>
												</Group>
											</Accordion.Control>
											<Accordion.Panel>
												<Stack gap="xs">
													{typeResources.map((resource) => (
														<ResourceCard
															key={resource.id}
															type={type}
															resource={resource}
															resolvedIds={resolvedIds}
															onSelect={onSelectResource}
														/>
													))}
												</Stack>
											</Accordion.Panel>
										</Accordion.Item>
									);
								})}
							</Accordion>
						)}
					</Stack>
				</ScrollArea>
			</Box>
		</Stack>
	);
}

interface ResourceCardProps {
	type: MigrationResourceType;
	resource: DiagnosticResource;
	resolvedIds: Set<string>;
	onSelect: (type: MigrationResourceType, resource: DiagnosticResource) => void;
}

function ResourceCard({ type, resource, resolvedIds, onSelect }: ResourceCardProps) {
	const unresolvedCount = countUnresolvedEntries(resource, resolvedIds);
	const typeMeta = resourceTypeMeta[type];

	return (
		<UnstyledButton
			w="100%"
			className={classes.resourceCard}
			onClick={() => onSelect(type, resource)}
		>
			<Paper
				p="sm"
				radius="md"
				bg="obsidian.8"
				withBorder={false}
			>
				<Group align="center">
					<ThemeIcon
						size="lg"
						color="obsidian"
						variant="light"
					>
						<Icon path={typeMeta.icon} />
					</ThemeIcon>
					<Box style={{ flex: 1 }}>
						{typeMeta.resource && resource.entries[0] && (
							<Text
								fw={500}
								fz="sm"
							>
								{typeMeta.resource(resource.entries[0].source)}
							</Text>
						)}
						<Group>
							<Text
								fw={500}
								c="bright"
								fz="lg"
							>
								{resource.name}
							</Text>
						</Group>
					</Box>
					<UnresolvedBadge count={unresolvedCount} />
				</Group>
			</Paper>
		</UnstyledButton>
	);
}
