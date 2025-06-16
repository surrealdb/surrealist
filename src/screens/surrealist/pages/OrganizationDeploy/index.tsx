import classes from "./style.module.scss";

import { Box, Button, Divider, Group, Paper, ScrollArea, Stack } from "@mantine/core";
import { Redirect } from "wouter";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { CloudSplash } from "~/components/CloudSplash";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated } from "~/hooks/cloud";
import { InstanceTypeSection } from "./sections/1-type";
import { useImmer } from "use-immer";
import { DeployConfig } from "./types";
import { ClusterStorageSection } from "./sections/2-storage";
import { DeploymentSection } from "./sections/3-instance";
import { SetupSection } from "./sections/4-setup";

const DEFAULT: DeployConfig = {
	name: "",
	region: "",
	type: null,
	units: 1,
	version: "",
	storageCategory: "standard",
	storageAmount: 0,
	dataset: false,
	credentials: false,
	username: "",
	password: "",
};

export interface OrganizationDeployPageProps {
	id: string;
}

export function OrganizationDeployPage({ id }: OrganizationDeployPageProps) {
	const isAuthed = useIsAuthenticated();
	const [details, setDetails] = useImmer(DEFAULT);

	const { data, isSuccess } = useCloudOrganizationsQuery();
	const organization = data?.find((org) => org.id === id);

	if (isSuccess && !organization) {
		return <Redirect to="/organisations" />;
	}

	return (
		<AuthGuard>
			{isAuthed ? (
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
							{organization && (
								<>
									<Box>
										<PageBreadcrumbs
											items={[
												{ label: "Surrealist", href: "/overview" },
												{ label: "Organisations", href: "/organisations" },
												{
													label: organization.name,
													href: `/o/${organization.id}`,
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
											organisation={organization}
											details={details}
											setDetails={setDetails}
										/>

										<ClusterStorageSection
											organisation={organization}
											details={details}
											setDetails={setDetails}
										/>

										<SetupSection
											organisation={organization}
											details={details}
											setDetails={setDetails}
										/>

										<DeploymentSection
											organisation={organization}
											details={details}
											setDetails={setDetails}
										/>

										<Group mt={24}>
											{/* <Link to={savepoint.path}>
												<Button
													color="slate"
													variant="light"
												>
													Cancel
												</Button>
											</Link>
											<Spacer /> */}
											<Button
												w={150}
												type="submit"
												variant="gradient"
												// disabled={disabled}
												// onClick={provisionInstance}
											>
												Deploy instance
											</Button>
										</Group>
									</Box>
								</>
							)}
						</Stack>
					</ScrollArea>
				</Box>
			) : (
				<CloudSplash />
			)}
		</AuthGuard>
	);
}
