import { Box, Button, Group, ScrollArea, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import { fork } from "radash";
import { Link, useSearchParams } from "wouter";
import { isOrganisationTerminated } from "~/cloud/helpers";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { CloudSplash } from "~/components/CloudSplash";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsAuthenticated } from "~/hooks/cloud";
import { ORGANIZATIONS, useSavepoint } from "~/hooks/overview";
import { OrganizationTile } from "./organization";
import classes from "./style.module.scss";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OrganizationsPage() {
	const isAuthed = useIsAuthenticated();
	const [params, _] = useSearchParams();
	const { data, isPending } = useCloudOrganizationsQuery();

	useSavepoint(ORGANIZATIONS);

	const [active, archived] = fork(data || [], (org) => !isOrganisationTerminated(org));

	return (
		<Box
			flex={1}
			pos="relative"
		>
			{isAuthed ? (
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
						<Box>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{ label: "Organisations" },
								]}
							/>
							<PrimaryTitle
								fz={32}
								mt="sm"
							>
								Organisations
							</PrimaryTitle>
						</Box>

						<Group mt="xl">
							<PrimaryTitle fz={22}>Your organisations</PrimaryTitle>
							<Spacer />
							<Link to="/organisations/create">
								<Button
									size="xs"
									variant="gradient"
								>
									Create organisation
								</Button>
							</Link>
						</Group>

						<SimpleGrid cols={GRID_COLUMNS}>
							{isPending && <Skeleton h={112} />}
							{active.map((org) => (
								<OrganizationTile
									key={org.id}
									organization={org}
									destination={params.get("destination")}
								/>
							))}
						</SimpleGrid>

						{archived.length > 0 && (
							<>
								<PrimaryTitle
									mt="xl"
									fz={22}
								>
									Archived organisations
								</PrimaryTitle>

								<SimpleGrid cols={GRID_COLUMNS}>
									{archived.map((org) => (
										<OrganizationTile
											key={org.id}
											organization={org}
											destination={params.get("destination")}
										/>
									))}
								</SimpleGrid>
							</>
						)}
					</Stack>
				</ScrollArea>
			) : (
				<CloudSplash />
			)}
		</Box>
	);
}
