import { Button, Center, Group, Loader, Paper, Select, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { getPlanForInstanceType, isScalePlan } from "~/cloud/helpers";
import { useUpdateInstanceBackupPolicyMutation } from "~/cloud/mutations/backup-policy";
import { useCloudBackupPolicyQuery } from "~/cloud/queries/backup-policy";
import { Form } from "~/components/Form";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CloudInstance } from "~/types";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { BackupUpgradeNotice } from "./BackupUpgradeNotice";

export interface BackupFrequencyProps {
	instance: CloudInstance;
}

/**
 * Format a frequency in hours into a human-readable label.
 */
function formatFrequency(hours: number): string {
	if (hours === 24) {
		return "Once a day (every 24 hours)";
	}

	if (hours === 1) {
		return "Every hour";
	}

	return `Every ${hours} hours`;
}

export function BackupFrequency({ instance }: BackupFrequencyProps) {
	const isLight = useIsLight();
	const { data: policy, isPending } = useCloudBackupPolicyQuery(instance.id);
	const { mutateAsync, isPending: isSaving } = useUpdateInstanceBackupPolicyMutation(instance.id);

	const [value, setValue] = useState<number | null>(null);
	const [initialValue, setInitialValue] = useState<number | null>(null);

	const isScale = isScalePlan(getPlanForInstanceType(instance.type));
	const frequency = policy?.frequency;

	useEffect(() => {
		if (frequency) {
			setValue(frequency.frequency_hours);
			setInitialValue(frequency.frequency_hours);
		}
	}, [frequency]);

	const options = useMemo(() => {
		if (!frequency) {
			return [];
		}

		return frequency.allowed_frequency_hours
			.slice()
			.sort((a, b) => a - b)
			.map((hours) => ({
				value: hours.toString(),
				label: formatFrequency(hours),
			}));
	}, [frequency]);

	const canEdit = isScale && (frequency?.editable ?? false);
	const isUnchanged = value === null || value === initialValue;
	const applyDisabled = !canEdit || isUnchanged || isPending || isSaving;

	const handleUpdate = useStable(async () => {
		if (value === null || value === initialValue) {
			return;
		}

		try {
			await mutateAsync({ frequency_hours: value });
			setInitialValue(value);

			showInfo({
				title: "Backup frequency updated",
				subtitle: `Backups will now run ${formatFrequency(value).toLowerCase()}.`,
			});
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to update backup frequency",
				content: err,
			});
		}
	});

	const handleCreateInstance = useStable(() => {
		navigate(`/o/${instance.organization_id}/instances/deploy`);
	});

	if (isPending) {
		return (
			<Center py="xl">
				<Loader type="dots" />
			</Center>
		);
	}

	return (
		<Form onSubmit={handleUpdate}>
			<Stack gap="md">
				<Paper
					p="lg"
					withBorder={false}
					bg={isLight ? "obsidian.1" : "obsidian.8"}
				>
					<Group
						align="center"
						wrap="nowrap"
						gap="lg"
					>
						<Stack
							flex={1}
							gap={2}
						>
							<Text
								c="bright"
								fw={600}
							>
								Frequency
							</Text>
							<Text fz="sm">
								How often automated backup snapshots are captured for this instance.
							</Text>
						</Stack>
						<Select
							w={260}
							data={options}
							value={value !== null ? value.toString() : null}
							disabled={!canEdit}
							allowDeselect={false}
							comboboxProps={{ withinPortal: true }}
							onChange={(next) => {
								if (next !== null) {
									setValue(Number.parseInt(next, 10));
								}
							}}
						/>
					</Group>

					{!isScale && (
						<BackupUpgradeNotice
							message="Configurable backup frequency is available on Scale instances."
							actionLabel="New scale instance"
							onAction={handleCreateInstance}
						/>
					)}
				</Paper>

				{isScale && (
					<Group>
						<Button
							type="submit"
							variant="gradient"
							loading={isSaving}
							disabled={applyDisabled}
						>
							Save changes
						</Button>
					</Group>
				)}
			</Stack>
		</Form>
	);
}
