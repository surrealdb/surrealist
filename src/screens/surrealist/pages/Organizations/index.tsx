import classes from "./style.module.scss";

import { Box, Button, Group, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";

import { CloudSplash } from "~/components/CloudSplash";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated } from "~/hooks/cloud";
import { Spacer } from "~/components/Spacer";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { Link } from "wouter";
import { OrganizationTile } from "./organization";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OrganizationsPage() {
	const isAuthed = useIsAuthenticated();

	const { data } = useCloudOrganizationsQuery();

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
						maw={1100}
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
									color="slate"
									variant="gradient"
								>
									Create organization
								</Button>
							</Link>
						</Group>

						<SimpleGrid cols={GRID_COLUMNS}>
							{data?.map((org) => (
								<OrganizationTile
									key={org.id}
									organization={org}
								/>
							))}
						</SimpleGrid>
					</Stack>
				</ScrollArea>
			) : (
				<CloudSplash />
			)}
		</Box>
	);
}
