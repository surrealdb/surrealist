import classes from "./style.module.scss";

import { Box, ScrollArea, Stack } from "@mantine/core";
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

const DEFAULT: DeployConfig = {
	name: "",
	region: "",
	type: null,
	units: 1,
	version: "",
	storageCategory: "standard",
	storageAmount: 0,
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

									<Stack gap="xl">
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
									</Stack>
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
