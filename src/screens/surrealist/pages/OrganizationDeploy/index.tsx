import classes from "./style.module.scss";

import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";

import { Box, ScrollArea, Stack, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { Redirect } from "wouter";
import { DEFAULT_DEPLOY_CONFIG, INSTANCE_PLAN_ARCHITECTURES } from "~/cloud/helpers";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { AuthGuard } from "~/components/AuthGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudDeployConfig, CloudInstance, CloudOrganization } from "~/types";
import { clamp } from "~/util/helpers";
import { generateRandomName } from "~/util/random";
import { PlanStep } from "./steps/1-plan";
import { ConfigureStep } from "./steps/2-configure";
import { CheckoutStep } from "./steps/3-checkout";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";

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
