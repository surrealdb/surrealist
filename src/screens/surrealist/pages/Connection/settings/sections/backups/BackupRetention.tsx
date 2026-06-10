import {
	Anchor,
	Box,
	Button,
	Center,
	Group,
	Loader,
	NumberInput,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import equal from "fast-deep-equal";
import { useEffect, useMemo, useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceBackupPolicyMutation } from "~/cloud/mutations/backup-policy";
import { useCloudBackupPolicyQuery } from "~/cloud/queries/backup-policy";
import { useStable } from "~/hooks/stable";
import { CloudBackupPolicyResponse, CloudInstance, CloudUpdateBackupPolicyRequest } from "~/types";
import { dispatchIntent } from "~/util/intents";
import classes from "../style.module.scss";

export interface BackupRetentionProps {
	instance: CloudInstance;
	/**
	 * Layout variant. "drawer" (default) fills its parent height with a scroll
	 * area and a Close/Apply footer. "page" renders as a plain stack suitable
	 * for embedding within a settings page section.
	 */
	variant?: "drawer" | "page";
	onClose?: () => void;
}

interface BackupPolicyFormValues {
	daily_retention_days: number;
	weekly_retention_weeks: number;
	monthly_retention_months: number;
}

function policyToFormValues(policy: CloudBackupPolicyResponse): BackupPolicyFormValues {
	return {
		daily_retention_days: policy.daily.retention_days,
		weekly_retention_weeks: policy.weekly.retention_weeks,
		monthly_retention_months: policy.monthly.retention_months,
	};
}

function buildUpdateRequest(
	initial: BackupPolicyFormValues,
	current: BackupPolicyFormValues,
): CloudUpdateBackupPolicyRequest {
	const request: CloudUpdateBackupPolicyRequest = {};

	if (current.daily_retention_days !== initial.daily_retention_days) {
		request.daily_retention_days = current.daily_retention_days;
	}

	if (current.weekly_retention_weeks !== initial.weekly_retention_weeks) {
		request.weekly_retention_weeks = current.weekly_retention_weeks;
	}

	if (current.monthly_retention_months !== initial.monthly_retention_months) {
		request.monthly_retention_months = current.monthly_retention_months;
	}

	return request;
}

export function BackupRetention({ instance, variant = "drawer", onClose }: BackupRetentionProps) {
	const { data: policy, isPending } = useCloudBackupPolicyQuery(instance.id);
	const [values, setValues] = useState<BackupPolicyFormValues | null>(null);
	const [initialValues, setInitialValues] = useState<BackupPolicyFormValues | null>(null);

	const { mutateAsync } = useUpdateInstanceBackupPolicyMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	useEffect(() => {
		if (policy) {
			const formValues = policyToFormValues(policy);
			setValues(formValues);
			setInitialValues(formValues);
		}
	}, [policy]);

	const hasEditableTier = useMemo(() => {
		if (!policy) {
			return false;
		}

		return policy.daily.editable || policy.weekly.editable || policy.monthly.editable;
	}, [policy]);

	const isUnchanged = useMemo(() => {
		if (!values || !initialValues) {
			return true;
		}

		return equal(values, initialValues);
	}, [values, initialValues]);

	const handleUpdate = useStable(() => {
		if (!values || !initialValues) {
			return;
		}

		const request = buildUpdateRequest(initialValues, values);

		if (Object.keys(request).length === 0) {
			return;
		}

		confirmUpdate(request);
		onClose?.();
	});

	const handleContactSales = useStable(() => {
		dispatchIntent("create-message", {
			type: "conversation",
			organisation: instance.organization_id,
			conversationType: "sales-enquiry",
			subject: "Backup retention enquiry",
			message: `Hello! I would like to discuss backup retention options for my instance (ID: ${instance.id}). Could you help me explore additional retention tiers? Thanks!`,
		});
	});

	const applyDisabled = !hasEditableTier || isUnchanged || isPending || !values;

	const tierFields = policy && values && (
		<>
			<BackupTierInput
				title="Daily backups"
				description="Automated daily backups retained for the specified number of days."
				value={values.daily_retention_days}
				min={policy.daily.min_days}
				max={policy.daily.max_days}
				unit="days"
				editable={policy.daily.editable}
				onContact={handleContactSales}
				onChange={(daily_retention_days) =>
					setValues((current) =>
						current ? { ...current, daily_retention_days } : current,
					)
				}
			/>

			<BackupTierInput
				title="Weekly backups"
				description="Backups taken each Sunday and retained for the specified number of weeks."
				value={values.weekly_retention_weeks}
				min={policy.weekly.min_weeks}
				max={policy.weekly.max_weeks}
				unit="weeks"
				editable={policy.weekly.editable}
				onContact={handleContactSales}
				onChange={(weekly_retention_weeks) =>
					setValues((current) =>
						current ? { ...current, weekly_retention_weeks } : current,
					)
				}
			/>

			<BackupTierInput
				title="Monthly backups"
				description="Backups taken on the 1st of each month and retained for the specified number of months."
				value={values.monthly_retention_months}
				min={policy.monthly.min_months}
				max={policy.monthly.max_months}
				unit="months"
				editable={policy.monthly.editable}
				onContact={handleContactSales}
				onChange={(monthly_retention_months) =>
					setValues((current) =>
						current ? { ...current, monthly_retention_months } : current,
					)
				}
			/>
		</>
	);

	if (variant === "page") {
		return (
			<Stack gap="xl">
				{isPending || !policy || !values ? (
					<Center py="xl">
						<Loader type="dots" />
					</Center>
				) : (
					<>
						{tierFields}

						<Group mt="xl">
							<Button
								type="submit"
								variant="gradient"
								disabled={applyDisabled}
								onClick={handleUpdate}
							>
								Apply retention
							</Button>
						</Group>
					</>
				)}
			</Stack>
		);
	}

	return (
		<Stack
			h="100%"
			gap={0}
		>
			<Box
				pos="relative"
				flex={1}
			>
				{isPending || !policy || !values ? (
					<Center h="100%">
						<Loader type="dots" />
					</Center>
				) : (
					<ScrollArea
						pos="absolute"
						inset={0}
						className={classes.scrollArea}
					>
						<Stack
							gap="xl"
							p="xl"
							mih="100%"
						>
							<Box mb="md">
								<Text
									fz="xl"
									c="bright"
									fw={600}
								>
									Backup retention
								</Text>

								<Text
									mt="sm"
									fz="lg"
								>
									Configure how long automated backups are retained across daily,
									weekly, and monthly tiers.
								</Text>
							</Box>

							{tierFields}
						</Stack>
					</ScrollArea>
				)}
			</Box>

			<Group p="xl">
				<Button
					onClick={onClose}
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled={applyDisabled}
					onClick={handleUpdate}
					flex={1}
				>
					Apply retention
				</Button>
			</Group>
		</Stack>
	);
}

interface BackupTierInputProps {
	title: string;
	description: string;
	value: number;
	min: number;
	max: number;
	unit: string;
	editable: boolean;
	onContact: () => void;
	onChange: (value: number) => void;
}

function BackupTierInput({
	title,
	description,
	value,
	min,
	max,
	unit,
	editable,
	onContact,
	onChange,
}: BackupTierInputProps) {
	return (
		<Stack gap="xs">
			<Text
				c="bright"
				fw={600}
			>
				{title}
			</Text>
			<Text>{description}</Text>
			{editable ? (
				<Text fz="sm">{`Allowed range: ${min}–${max} ${unit}`}</Text>
			) : (
				<Group gap="xs">
					<Text fz="sm">Need to make changes?</Text>
					<Anchor
						variant="vibrant"
						fz="sm"
						onClick={onContact}
					>
						Contact us
					</Anchor>
				</Group>
			)}
			<NumberInput
				value={value}
				min={min}
				max={max}
				step={1}
				allowDecimal={false}
				disabled={!editable}
				hideControls={!editable}
				suffix={` ${unit}`}
				onChange={(next) => {
					if (typeof next === "number") {
						onChange(next);
					}
				}}
			/>
		</Stack>
	);
}
