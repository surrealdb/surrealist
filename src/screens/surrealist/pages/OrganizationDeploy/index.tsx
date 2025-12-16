import { Box, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { Redirect } from "wouter";
import {
	DEFAULT_DEPLOY_CONFIG,
	INSTANCE_CATEGORY_PLANS,
	INSTANCE_PLAN_ARCHITECTURES,
} from "~/cloud/helpers";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useSearchParams } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudDeployConfig, CloudInstance, CloudOrganization } from "~/types";
import { clamp, showErrorNotification } from "~/util/helpers";
import { generateRandomName } from "~/util/random";
import { PlanStep } from "./steps/1-plan";
import { ConfigureStep } from "./steps/2-configure";
import { CheckoutStep } from "./steps/3-checkout";
import classes from "./style.module.scss";

export interface OrganizationDeployPageProps {
	id: string;
}

export function OrganizationDeployPage({ id }: OrganizationDeployPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const instancesQuery = useCloudOrganizationInstancesQuery(id);
	const instances = instancesQuery.data ?? [];

	const { data: organisation } = useCloudOrganizationQuery(id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/organisations" />;
	}

	return (
		<AuthGuard loading={organisationsQuery.isLoading || instancesQuery.isLoading}>
			<PageContent
				organisation={organisation as CloudOrganization}
				instances={instances}
			/>
		</AuthGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
	instances: CloudInstance[];
}

function PageContent({ organisation, instances }: PageContentProps) {
	const [step, setStep] = useState(0);
	const [details, setDetails] = useImmer<CloudDeployConfig>(() => ({
		...DEFAULT_DEPLOY_CONFIG,
		name: generateRandomName(),
	}));

	const { instanceId, backupId } = useSearchParams();

	const [baseInstance, setBaseInstance] = useState<CloudInstance | undefined>(undefined);
	const updateStep = useStable((newStep: number) => {
		setStep(clamp(newStep, 0, 2));
	});

	const stepTitles = useMemo(() => {
		const [archName, archKind] = INSTANCE_PLAN_ARCHITECTURES[details.plan];

		return [
			"Select a plan",
			`Configure your ${archName.toLowerCase()} ${archKind.toLowerCase()}`,
			"Checkout",
		];
	}, [details.plan]);

	const { data: backups } = useCloudBackupsQuery(baseInstance?.id);

	useEffect(() => {
		setBaseInstance(details.startingData.backupOptions?.instance);
	}, [details.startingData.backupOptions?.instance]);

	useEffect(() => {
		if (instanceId) {
			const foundInstance = instances.find((instance) => instance.id === instanceId);

			if (!foundInstance) {
				showErrorNotification({
					title: "Instance not found",
					content: "The instance you selected could not be found.",
				});
				return;
			}

			setBaseInstance(foundInstance);

			const backup = backups?.find((backup) => backup.snapshot_id === backupId);

			if (!backup) {
				showErrorNotification({
					title: "Backup not found",
					content: "The backup you selected could not be found.",
				});
				return;
			}

			const guessedPlan = INSTANCE_CATEGORY_PLANS[foundInstance.type.category];

			setDetails((draft) => {
				draft.startingData = {
					type: "restore",
					backupOptions: {
						backup: backup,
						instance: foundInstance,
					},
				};

				draft.plan = guessedPlan;
				draft.region = foundInstance.region;
				draft.computeType = foundInstance.type.slug;
				draft.computeUnits = foundInstance.compute_units;
				draft.storageType = foundInstance.type.slug;
				draft.storageUnits = foundInstance.distributed_storage_specs?.units ?? 0;
				draft.version = foundInstance.version;
				draft.name = `${foundInstance.name} Copy`;
				draft.storageAmount = Math.max(
					foundInstance.type.default_storage_size,
					foundInstance.storage_size,
				);
			});

			setStep(1);
		}
	}, [instances, backups, instanceId, backupId]);

	return (
		<CloudAdminGuard organisation={organisation}>
			<Box
				flex={1}
				pos="relative"
			>
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					mt={18}
				>
					<Stack
						px="xl"
						mx="auto"
						maw={1200}
						pb={68}
					>
						{organisation && (
							<>
								<Box>
									<PageBreadcrumbs
										items={[
											{ label: "Surrealist", href: "/overview" },
											{ label: "Organisations", href: "/organisations" },
											{
												label: organisation.name,
												href: `/o/${organisation.id}`,
											},
											{ label: "Deploy instance" },
										]}
									/>
									<PrimaryTitle
										mt="sm"
										fz={32}
									>
										<Text
											span
											inherit
											opacity={0.3}
											mr="sm"
										>
											{step + 1}.
										</Text>
										{stepTitles[step]}
									</PrimaryTitle>
								</Box>

								<Box my="xl">
									{step === 0 && (
										<PlanStep
											organisation={organisation}
											instances={instances}
											details={details}
											setDetails={setDetails}
											setStep={setStep}
										/>
									)}

									{step === 1 && (
										<ConfigureStep
											organisation={organisation}
											backups={backups}
											instances={instances}
											details={details}
											setDetails={setDetails}
											setStep={updateStep}
										/>
									)}

									{step === 2 && (
										<CheckoutStep
											organisation={organisation}
											instances={instances}
											details={details}
											setDetails={setDetails}
											setStep={updateStep}
										/>
									)}
								</Box>
							</>
						)}
					</Stack>
				</ScrollArea>
			</Box>
		</CloudAdminGuard>
	);
}
