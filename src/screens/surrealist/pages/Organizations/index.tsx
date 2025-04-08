import classes from "./style.module.scss";

import { Box, Button, Group, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";

import { fork } from "radash";
import { Link } from "wouter";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { CloudSplash } from "~/components/CloudSplash";
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
	const { data } = useCloudOrganizationsQuery();

	useSavepoint(ORGANIZATIONS);

	const [active, archived] = fork(data || [], (org) => org.archived_at === undefined);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

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
						maw={1000}
						mt={75}
					>
						<Box>
							<PrimaryTitle fz={26}>Organizations</PrimaryTitle>
							<Text fz="xl">View and manage your Surreal Cloud organizations</Text>
						</Box>

						<Group mt="xl">
							<PrimaryTitle>Your organizations</PrimaryTitle>
							<Spacer />
							<Link to="/create/organization">
								<Button
									size="xs"
									variant="gradient"
								>
									Create organization
								</Button>
							</Link>
						</Group>

						<SimpleGrid cols={GRID_COLUMNS}>
							{active.map((org) => (
								<OrganizationTile
									key={org.id}
									organization={org}
								/>
							))}
						</SimpleGrid>

						{archived.length > 0 && (
							<>
								<PrimaryTitle mt="xl">Archived organizations</PrimaryTitle>

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
