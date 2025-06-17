import classes from "./style.module.scss";

import { Box, Button, Divider, Group, ScrollArea, Stack } from "@mantine/core";
import { Link, Redirect, useLocation } from "wouter";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { InstanceTypeSection } from "./sections/1-type";
import { useImmer } from "use-immer";
import { ClusterStorageSection } from "./sections/2-cluster";
import { DeploymentSection } from "./sections/3-instance";
import { Spacer } from "~/components/Spacer";
import { Icon } from "~/components/Icon";
import { iconChevronRight } from "~/util/icons";
import { useLastSavepoint } from "~/hooks/overview";
import { Text } from "@mantine/core";
import { useMemo } from "react";
import { generateRandomName } from "~/util/random";
import { DEFAULT_DEPLOY_CONFIG } from "~/cloud/helpers";
import { useStable } from "~/hooks/stable";
import { DEPLOY_CONFIG_KEY } from "~/util/storage";
import { CloudOrganization } from "~/types";

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

	const [details, setDetails] = useImmer(() => {
		const cached = localStorage.getItem(cacheKey);
		const overwrites = cached ? JSON.parse(cached) : {};

		localStorage.removeItem(cacheKey);

		return {
			...DEFAULT_DEPLOY_CONFIG,
			name: generateRandomName(),
			...overwrites,
		};
	});

	// const estimationQuery = useCloudEstimationQuery(organisation, details);

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
				viewportProps={{
					style: { paddingBottom: 75 },
				}}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					mt={90}
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
									<Box ta="right">
										<Text
											c="var(--mantine-color-indigo-light-color)"
											fz="md"
											fw={800}
											tt="uppercase"
											lts={1}
										>
											Billed monthly
										</Text>
										<Group
											gap="xs"
											align="start"
										>
											<Text
												fz={28}
												fw={600}
												c="bright"
											>
												TODO
												{/* {CURRENCY_FORMAT.format(
															estimatedCost * 24 * 30,
														)} */}
											</Text>
											<Text
												mt={12}
												fz="xl"
												fw={500}
											>
												/ mo
											</Text>
										</Group>
									</Box>
								</Group>
							</Box>
						</>
					)}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
