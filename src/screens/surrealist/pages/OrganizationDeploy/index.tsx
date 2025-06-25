import classes from "./style.module.scss";

import { Box, ScrollArea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useImmer } from "use-immer";
import { Redirect } from "wouter";
import { adapter } from "~/adapter";
import { DEFAULT_DEPLOY_CONFIG } from "~/cloud/helpers";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useStable } from "~/hooks/stable";
import { CloudDeployConfig, CloudOrganization } from "~/types";
import { clamp } from "~/util/helpers";
import { generateRandomName } from "~/util/random";
import { DEPLOY_CONFIG_KEY } from "~/util/storage";
import { PlanStep } from "./steps/1-plan";
import { ConfigureStep } from "./steps/2-configure";
import { CheckoutStep } from "./steps/3-checkout";

const STEPS = ["Select a plan", "Configure your instance", "Checkout"];

export interface OrganizationDeployPageProps {
	id: string;
}

export function OrganizationDeployPage({ id }: OrganizationDeployPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const organisation = organisationsQuery.data?.find((org) => org.id === id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/organisations" />;
	}

	return (
		<AuthGuard loading={organisationsQuery.isLoading}>
			<PageContent organisation={organisation as CloudOrganization} />
		</AuthGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
}

function PageContent({ organisation }: PageContentProps) {
	const cacheKey = `${DEPLOY_CONFIG_KEY}:${organisation.id}`;
	const [step, setStep] = useState(0);

	const [details, setDetails] = useImmer<CloudDeployConfig>(() => {
		const cached = localStorage.getItem(cacheKey);
		const overwrites = cached ? JSON.parse(cached) : {};

		localStorage.removeItem(cacheKey);

		return {
			...DEFAULT_DEPLOY_CONFIG,
			name: generateRandomName(),
			...overwrites,
		};
	});

	const updateStep = useStable((newStep: number) => {
		setStep(clamp(newStep, 0, STEPS.length - 1));
	});

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				mt={68 + adapter.titlebarOffset}
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
									{STEPS[step]}
								</PrimaryTitle>
							</Box>

							<Box my="xl">
								{step === 0 && (
									<PlanStep
										organisation={organisation}
										details={details}
										setDetails={setDetails}
										setStep={setStep}
									/>
								)}

								{step === 1 && (
									<ConfigureStep
										organisation={organisation}
										details={details}
										setDetails={setDetails}
										setStep={updateStep}
									/>
								)}

								{step === 2 && (
									<CheckoutStep
										organisation={organisation}
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
	);
}
