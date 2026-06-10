import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import {
	Icon,
	iconBug,
	iconCheck,
	iconCopy,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconOrganization,
	iconPackageClosed,
	iconQuery,
	iconTag,
} from "@surrealdb/ui";
import { Link } from "wouter";
import { useCloudAuthTokenMutation } from "~/cloud/mutations/auth";
import { PropertyValue } from "~/components/PropertyValue";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance, CloudOrganization } from "~/types";
import { formatBackupPolicySummary, getTypeCategoryName } from "~/util/cloud";
import { formatMemory, plural, showErrorNotification, showInfo } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";

export interface InstanceDetailsSectionProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

export function InstanceDetailsSection({ instance, organisation }: InstanceDetailsSectionProps) {
	const regions = useCloudStore((s) => s.instanceRegions);
	const regionName =
		regions.find((r) => r.slug === instance.region)?.description ?? instance.region;

	const authTokenMutation = useCloudAuthTokenMutation(instance.id);

	const typeName = instance.type.display_name ?? "";
	const typeCategory = instance.type.category ?? "";
	const isFree = instance.type.category === "free";
	const backupSummary = formatBackupPolicySummary(instance.backup_policy);
	const backupText = isFree ? "Upgrade required" : (backupSummary ?? "Active");
	const typeText = isFree ? "Free" : `${typeName} (${getTypeCategoryName(typeCategory)})`;

	const handleCopyAuthToken = useStable(async () => {
		const token = await authTokenMutation.mutateAsync();

		if (!token) {
			return showErrorNotification({
				title: "Failed to copy auth token",
				content: "Auth token is not available",
			});
		}

		try {
			await navigator.clipboard.writeText(token);
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied auth token to clipboard",
			});
		} catch (_error) {
			showErrorNotification({
				title: "Failed to copy auth token",
				content: "Unable to copy auth token to clipboard",
			});
		}
	});

	const handleReportIssue = useStable(() => {
		dispatchIntent("create-message", {
			type: "conversation",
			organisation: organisation.id,
			message: `Hello! I would like to report an issue regarding my instance (ID: ${instance.id})`,
			conversationType: "instance-issue",
		});
	});

	return (
		<Section
			title="Cloud instance"
			description="Details and identifiers for your SurrealDB Cloud instance"
		>
			<Paper p="md">
				<SimpleGrid cols={{ base: 1, md: 2 }}>
					<Stack>
						<PropertyValue
							title="Type"
							icon={iconPackageClosed}
							value={typeText}
						/>
						<PropertyValue
							title="Region"
							icon={iconMarker}
							value={regionName}
						/>
						<PropertyValue
							title="Version"
							icon={iconTag}
							value={`SurrealDB ${instance.version}`}
						/>
						<PropertyValue
							title="Backups"
							icon={iconHistory}
							value={
								<Text
									className={!isFree ? "selectable" : undefined}
									c={isFree ? "orange" : undefined}
								>
									{backupText}
								</Text>
							}
						/>
					</Stack>
					<Stack>
						<PropertyValue
							title="Memory"
							icon={iconMemory}
							value={formatMemory(instance.type.memory ?? 0)}
						/>
						<PropertyValue
							title="Compute"
							icon={iconQuery}
							value={`${instance.type.cpu ?? 0} ${plural(instance.type.cpu ?? 0, "vCPU")}`}
						/>
						<PropertyValue
							title="Storage limit"
							icon={iconDatabase}
							value={formatMemory((instance.storage_size ?? 0) * 1000, true)}
						/>
					</Stack>
				</SimpleGrid>

				<Stack
					gap="sm"
					mt="xl"
				>
					<CopyField
						label="Hostname"
						value={instance.host}
					/>
					<CopyField
						label="Instance ID"
						value={instance.id}
					/>
				</Stack>

				<Group
					mt="xl"
					gap="sm"
				>
					<Link href={`/o/${instance.organization_id}`}>
						<Button
							size="xs"
							variant="light"
							color="obsidian"
							leftSection={<Icon path={iconOrganization} />}
						>
							View organisation
						</Button>
					</Link>
					<Button
						size="xs"
						variant="light"
						color="obsidian"
						leftSection={<Icon path={iconBug} />}
						onClick={handleReportIssue}
					>
						Report an issue
					</Button>
					<Button
						size="xs"
						variant="light"
						color="obsidian"
						onClick={handleCopyAuthToken}
						disabled={instance.state !== "ready"}
					>
						Copy auth token
					</Button>
				</Group>
			</Paper>
		</Section>
	);
}

interface CopyFieldProps {
	label: string;
	value: string;
}

function CopyField({ label, value }: CopyFieldProps) {
	return (
		<Group
			justify="space-between"
			wrap="nowrap"
		>
			<Box flex={1}>
				<Text
					fz="sm"
					fw={600}
				>
					{label}
				</Text>
				<Text
					className="selectable"
					truncate
					maw={500}
				>
					{value}
				</Text>
			</Box>
			<CopyButton value={value}>
				{({ copied, copy }) => (
					<Tooltip label={copied ? "Copied" : "Copy"}>
						<ActionIcon
							variant="subtle"
							color={copied ? "green" : "slate"}
							onClick={copy}
							aria-label={`Copy ${label}`}
						>
							<Icon path={copied ? iconCheck : iconCopy} />
						</ActionIcon>
					</Tooltip>
				)}
			</CopyButton>
		</Group>
	);
}
