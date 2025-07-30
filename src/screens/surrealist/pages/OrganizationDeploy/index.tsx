import { Alert, Box, ScrollArea, Stack, Text } from "@mantine/core";
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
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useSearchParams } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useTheme } from "~/hooks/theme";
import { CloudDeployConfig, CloudInstance, CloudOrganization } from "~/types";
import { clamp } from "~/util/helpers";
import { iconHelp, iconWarning } from "~/util/icons";
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
	const theme = useTheme();
	const [step, setStep] = useState(0);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [baseInstance, setBaseInstance] = useState<CloudInstance | undefined>(undefined);
	const [details, setDetails] = useImmer<CloudDeployConfig>(() => ({
		...DEFAULT_DEPLOY_CONFIG,
		name: generateRandomName(),
	}));

	const { instanceId, backupId } = useSearchParams();

	const updateStep = useStable((newStep: number) => {
		setStep(clamp(newStep, 0, 2));
	});

	const { data: backups } = useCloudBackupsQuery(baseInstance?.id);

	const stepTitles = useMemo(() => {
		const [archName, archKind] = INSTANCE_PLAN_ARCHITECTURES[details.plan];

		return [
			"Select a plan",
			`Configure your ${archName.toLowerCase()} ${archKind.toLowerCase()}`,
			"Checkout",
		];
	}, [details.plan]);

	useEffect(() => {
		setWarnings([]);

		if (instanceId) {
			const foundInstance = instances.find((instance) => instance.id === instanceId);

			if (!foundInstance) {
				setWarnings((draft) => [...draft, "Unable to fetch base instance"]);
				return;
			}

			const guessedPlan = INSTANCE_CATEGORY_PLANS[foundInstance.type.category];

			setDetails((draft) => {
				draft.plan = guessedPlan;
				draft.dataset = false;
				draft.region = foundInstance.region;
				draft.type = foundInstance.type.slug;
				draft.version = foundInstance.version;
				draft.units = foundInstance.compute_units;
				draft.storageAmount = foundInstance.storage_size;
				draft.storageCategory =
					foundInstance.distributed_storage_specs?.category ?? "standard";
				draft.name = `${foundInstance.name} Copy`;
				draft.backup = backups?.find((backup) => backup.snapshot_id === backupId);
				draft.baseInstance = foundInstance.id;
			});

			setBaseInstance(foundInstance);
			setStep(1);
		}
	}, [instances, backups, instanceId, backupId]);

	return (
		<CloudAdminGuard organizationId={organisation.id}>
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

									{details.backup && (
										<Alert
											mt="sm"
											color="violet"
											icon={
												<Icon
													path={iconHelp}
													c={theme === "dark" ? "violet.3" : "violet.7"}
												/>
											}
										>
											<Text
												fz={13}
												c={theme === "dark" ? "violet.1" : "violet.7"}
											>
												You are deploying a new instance from an existing
												backup
												{baseInstance?.name
													? ` of "${baseInstance.name}"`
													: ""}
												. Some configuration options are disabled.
											</Text>
										</Alert>
									)}

									{warnings.map((warning) => (
										<Alert
											key={warning}
											color="red"
											mt="sm"
											icon={<Icon path={iconWarning} />}
										>
											{warning}
										</Alert>
									))}
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
											baseInstance={baseInstance}
											details={details}
											setDetails={setDetails}
											setStep={updateStep}
										/>
									)}

									{step === 2 && (
										<CheckoutStep
											organisation={organisation}
											instances={instances}
											baseInstance={baseInstance}
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
