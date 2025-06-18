import classes from "./style.module.scss";

import { Box, Button, Divider, Group, ScrollArea, Stack } from "@mantine/core";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { Link, Redirect, useLocation } from "wouter";
import { DEFAULT_DEPLOY_CONFIG } from "~/cloud/helpers";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useLastSavepoint } from "~/hooks/overview";
import { useStable } from "~/hooks/stable";
import { CloudDeployConfig, CloudOrganization } from "~/types";
import { iconChevronRight } from "~/util/icons";
import { generateRandomName } from "~/util/random";
import { DEPLOY_CONFIG_KEY } from "~/util/storage";
import { InstanceTypeSection } from "./sections/1-type";
import { ClusterStorageSection } from "./sections/2-cluster";
import { DeploymentSection } from "./sections/3-instance";
import { adapter } from "~/adapter";

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

	const savepoint = useLastSavepoint();
	const [, navigate] = useLocation();

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

	const checkoutDisabled = useMemo(() => {
		if (!details.name || details.name.length > 30) return true;
		if (!details.region) return true;
		if (!details.type) return true;
		if (!details.version) return true;

		if (details.type !== "free" && !details.units) return true;

		return false;
	}, [details]);

	const handleCheckout = useStable(() => {
		localStorage.setItem(cacheKey, JSON.stringify(details));
		navigate("checkout");
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
									Deploy your instance
								</PrimaryTitle>
							</Box>

							<Box pb={300}>
								<InstanceTypeSection
									organisation={organisation}
									details={details}
									setDetails={setDetails}
								/>

								<ClusterStorageSection
									organisation={organisation}
									details={details}
									setDetails={setDetails}
								/>

								<DeploymentSection
									organisation={organisation}
									details={details}
									setDetails={setDetails}
								/>

								<Divider my={36} />

								<Group>
									<Link href={savepoint.path}>
										<Button
											color="slate"
											variant="light"
										>
											Cancel
										</Button>
									</Link>
									<Button
										type="submit"
										variant="gradient"
										disabled={checkoutDisabled}
										onClick={handleCheckout}
										rightSection={<Icon path={iconChevronRight} />}
									>
										Continue to checkout
									</Button>
									<Spacer />
									<EstimatedCost
										ta="right"
										organisation={organisation}
										config={details}
									/>
								</Group>
							</Box>
						</>
					)}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
