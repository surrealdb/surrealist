import classes from "./style.module.scss";

import { Box, Button, Group, ScrollArea, SimpleGrid, Skeleton, Stack } from "@mantine/core";

import { fork } from "radash";
import { Link } from "wouter";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { CloudSplash } from "~/components/CloudSplash";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated } from "~/hooks/cloud";
import { ORGANIZATIONS, useSavepoint } from "~/hooks/overview";
import { OrganizationTile } from "./organization";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OrganizationsPage() {
	const isAuthed = useIsAuthenticated();
	const { data, isPending } = useCloudOrganizationsQuery();

	useSavepoint(ORGANIZATIONS);

	const [active, archived] = fork(data || [], (org) => org.archived_at === undefined);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

			{isAuthed ? (
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
							<Link to="/create/organisation">
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
