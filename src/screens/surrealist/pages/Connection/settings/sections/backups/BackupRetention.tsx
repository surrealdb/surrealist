import {
	Box,
	Button,
	Center,
	Group,
	Loader,
	NumberInput,
	Paper,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import equal from "fast-deep-equal";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceBackupPolicyMutation } from "~/cloud/mutations/backup-policy";
import { useCloudBackupPolicyQuery } from "~/cloud/queries/backup-policy";
import { Form } from "~/components/Form";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CloudBackupPolicyResponse, CloudInstance, CloudUpdateBackupPolicyRequest } from "~/types";
import { dispatchIntent } from "~/util/intents";
import classes from "../style.module.scss";
import { BackupUpgradeNotice } from "./BackupUpgradeNotice";

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

	const applyDisabled = !hasEditableTier || isUnchanged || isPending || !values;

	const retentionForm =
		policy && values ? (
			<RetentionPolicyForm
				instance={instance}
				policy={policy}
				values={values}
				onChange={setValues}
			/>
		) : null;

	const saveButton = (
		<Button
			type="submit"
			variant="gradient"
			disabled={applyDisabled}
		>
			Save changes
		</Button>
	);

	if (variant === "page") {
		return (
			<Form onSubmit={handleUpdate}>
				{isPending || !retentionForm ? (
					<Center py="xl">
						<Loader type="dots" />
					</Center>
				) : (
					<Stack gap="md">
						{retentionForm}
						<Group>{saveButton}</Group>
					</Stack>
				)}
			</Form>
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
				{isPending || !retentionForm ? (
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

							{retentionForm}
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
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}

interface RetentionPolicyFormProps {
	instance: CloudInstance;
	policy: CloudBackupPolicyResponse;
	values: BackupPolicyFormValues;
	onChange: Dispatch<SetStateAction<BackupPolicyFormValues | null>>;
}

function RetentionPolicyForm({ instance, policy, values, onChange }: RetentionPolicyFormProps) {
	const isLight = useIsLight();

	const handleContactSales = useStable(() => {
		dispatchIntent("create-message", {
			type: "conversation",
			organisation: instance.organization_id,
			conversationType: "sales-enquiry",
			subject: "Backup retention enquiry",
			message: `Hello! I would like to discuss backup retention options for my instance (ID: ${instance.id}). Could you help me explore additional retention tiers? Thanks!`,
		});
	});

	const hasLockedTier =
		!policy.daily.editable || !policy.weekly.editable || !policy.monthly.editable;

	const tiers = [
		{
			title: "Daily",
			schedule: "Snapshots every day",
			value: values.daily_retention_days,
			min: policy.daily.min_days,
			max: policy.daily.max_days,
			unit: "days",
			editable: policy.daily.editable,
			onChange: (daily_retention_days: number) =>
				onChange((current) => (current ? { ...current, daily_retention_days } : current)),
		},
		{
			title: "Weekly",
			schedule: "Snapshots each Sunday",
			value: values.weekly_retention_weeks,
			min: policy.weekly.min_weeks,
			max: policy.weekly.max_weeks,
			unit: "weeks",
			editable: policy.weekly.editable,
			onChange: (weekly_retention_weeks: number) =>
				onChange((current) => (current ? { ...current, weekly_retention_weeks } : current)),
		},
		{
			title: "Monthly",
			schedule: "Snapshots on the 1st of each month",
			value: values.monthly_retention_months,
			min: policy.monthly.min_months,
			max: policy.monthly.max_months,
			unit: "months",
			editable: policy.monthly.editable,
			onChange: (monthly_retention_months: number) =>
				onChange((current) =>
					current ? { ...current, monthly_retention_months } : current,
				),
		},
	] as const;

	return (
		<Paper
			p="lg"
			withBorder={false}
			bg={isLight ? "obsidian.1" : "obsidian.8"}
		>
			<Stack gap="md">
				{tiers.map((tier) => (
					<BackupTierRow
						key={tier.title}
						{...tier}
					/>
				))}
			</Stack>
			{hasLockedTier && (
				<BackupUpgradeNotice
					message="Longer backup retention across daily, weekly, and monthly tiers is available on higher instance plans."
					actionLabel="Contact us"
					onAction={handleContactSales}
				/>
			)}
		</Paper>
	);
}

interface BackupTierRowProps {
	title: string;
	schedule: string;
	value: number;
	min: number;
	max: number;
	unit: string;
	editable: boolean;
	onChange: (value: number) => void;
}

function BackupTierRow({
	title,
	schedule,
	value,
	min,
	max,
	unit,
	editable,
	onChange,
}: BackupTierRowProps) {
	const scheduleDetail = editable
		? `${schedule} · Allowed range: ${min}–${max} ${unit}`
		: `${schedule} · Not configurable`;

	return (
		<Group
			align="center"
			wrap="nowrap"
			gap="lg"
		>
			<Box flex={1}>
				<Text
					c="bright"
					fw={600}
				>
					{title}
				</Text>
				<Text fz="sm">{scheduleDetail}</Text>
			</Box>
			<NumberInput
				w={160}
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
		</Group>
	);
}
