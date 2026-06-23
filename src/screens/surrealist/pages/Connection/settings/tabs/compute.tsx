import { Box, Button, Group, Paper, Stack } from "@mantine/core";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { hasOrganizationRoles, INSTANCE_CATEGORY_PLANS, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceNodeMutation } from "~/cloud/mutations/node";
import { useUpdateInstanceStorageMutation } from "~/cloud/mutations/storage";
import { useUpdateInstanceTypeMutation } from "~/cloud/mutations/type";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { showErrorNotification } from "~/util/helpers";
import { ConfigurationNodes } from "../sections/compute/nodes";
import { ConfigurationStorage, getStorageConstraints } from "../sections/compute/storage";
import { ConfigurationInstanceType } from "../sections/compute/type";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionComputeTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;
	const instanceTypeRef = useRef<HTMLDivElement>(null);

	const scrollToInstanceType = useStable(() => {
		instanceTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	});

	if (!instance || !organisation) {
		return null;
	}

	const isAdmin = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const isIdle = instance.state !== "ready" && instance.state !== "paused";
	const guessedPlan = INSTANCE_CATEGORY_PLANS[instance.type.category];
	const showComputeNodes = guessedPlan === "scale";

	if (!isAdmin || isIdle) {
		return (
			<Stack>
				<PrimaryTitle fz={32}>Instance configuration</PrimaryTitle>
				<Section title="Unavailable">
					<Paper p="md">
						Instance configuration is unavailable while the instance is not ready or you
						lack admin permissions.
					</Paper>
				</Section>
			</Stack>
		);
	}

	return (
		<ConnectionComputeForm
			instance={instance}
			organisation={organisation}
			showComputeNodes={showComputeNodes}
			instanceTypeRef={instanceTypeRef}
			onUpgrade={scrollToInstanceType}
		/>
	);
}

interface ConnectionComputeFormProps {
	instance: NonNullable<ConnectionSettingsTabProps["instanceQuery"]["data"]>;
	organisation: NonNullable<ConnectionSettingsTabProps["organisationQuery"]["data"]>;
	showComputeNodes: boolean;
	instanceTypeRef: RefObject<HTMLDivElement | null>;
	onUpgrade: () => void;
}

function ConnectionComputeForm({
	instance,
	organisation,
	showComputeNodes,
	instanceTypeRef,
	onUpgrade,
}: ConnectionComputeFormProps) {
	const [selectedType, setSelectedType] = useState("");
	const [storageValue, setStorageValue] = useState(instance.storage_size);
	const [nodesValue, setNodesValue] = useState(instance.compute_units);

	useEffect(() => {
		setStorageValue(instance.storage_size);
	}, [instance.storage_size]);

	useEffect(() => {
		setNodesValue(instance.compute_units);
	}, [instance.compute_units]);

	const isFree = instance.type.category === "free";
	const { isMaximized, isCoolingDown } = useMemo(
		() => getStorageConstraints(instance),
		[instance],
	);

	const hasTypeChange = !!selectedType;
	const hasStorageChange = !isFree && storageValue !== instance.storage_size;
	const hasNodesChange = showComputeNodes && nodesValue !== instance.compute_units;
	const isStorageInvalid =
		hasStorageChange && (storageValue < instance.storage_size || isMaximized || isCoolingDown);
	const canSave = (hasTypeChange || hasStorageChange || hasNodesChange) && !isStorageInvalid;

	const { mutateAsync: updateType } = useUpdateInstanceTypeMutation(instance);
	const { mutateAsync: updateStorage } = useUpdateInstanceStorageMutation(instance);
	const { mutateAsync: updateNodes } = useUpdateInstanceNodeMutation(instance);

	const applyUpdates = useStable(async () => {
		try {
			if (hasTypeChange) {
				await updateType(selectedType);
				setSelectedType("");
			}

			if (hasStorageChange) {
				await updateStorage(storageValue);
			}

			if (hasNodesChange) {
				await updateNodes(nodesValue);
			}
		} catch (err: unknown) {
			showErrorNotification({
				title: "Instance update failed",
				content: err,
			});
		}
	});

	const confirmSave = useUpdateConfirmation(applyUpdates);

	const handleSave = useStable(() => {
		confirmSave();
	});

	return (
		<Stack>
			<PrimaryTitle fz={32}>Instance configuration</PrimaryTitle>

			<Form onSubmit={handleSave}>
				<Box ref={instanceTypeRef}>
					<ConfigurationInstanceType
						instance={instance}
						organisation={organisation}
						variant="page"
						onClose={() => {}}
						selectedType={selectedType}
						onSelectedTypeChange={setSelectedType}
						hideFooter
					/>
				</Box>

				<Box mt="xl">
					<Section
						title="Storage capacity"
						description="Increase the storage limit for this instance"
					>
						<ConfigurationStorage
							instance={instance}
							variant="page"
							onClose={() => {}}
							onUpgrade={onUpgrade}
							value={storageValue}
							onValueChange={setStorageValue}
							hideFooter
						/>
					</Section>
				</Box>

				{showComputeNodes && (
					<Box mt="xl">
						<Section
							title="Compute nodes"
							description="Configure dedicated compute nodes for scale deployments"
						>
							<ConfigurationNodes
								instance={instance}
								variant="page"
								onClose={() => {}}
								value={nodesValue}
								onValueChange={setNodesValue}
								hideFooter
							/>
						</Section>
					</Box>
				)}

				<Group mt="xl">
					<Button
						type="submit"
						variant="gradient"
						disabled={!canSave}
					>
						Save changes
					</Button>
				</Group>
			</Form>
		</Stack>
	);
}
