import classes from "./style.module.scss";

import { Box, ScrollArea, SimpleGrid, Skeleton, Stack } from "@mantine/core";

import { fork } from "radash";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { CloudSplash } from "~/components/CloudSplash";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsAuthenticated } from "~/hooks/cloud";
import { ORGANIZATIONS, useSavepoint } from "~/hooks/overview";
import { OrganizationTile } from "../Organizations/organization";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function TicketOrganizationsPage() {
	const isAuthed = useIsAuthenticated();
	const { data, isPending } = useCloudOrganizationsQuery();

	useSavepoint(ORGANIZATIONS);

	const [active, archived] = fork(data || [], (org) => org.archived_at === undefined);

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
									{ label: "Tickets" },
								]}
							/>
							<PrimaryTitle
								fz={32}
								mt="sm"
							>
								Support Tickets
							</PrimaryTitle>
						</Box>

						<PrimaryTitle fz={22} mt="xl">Select an organisation</PrimaryTitle>

						<SimpleGrid cols={GRID_COLUMNS}>
							{isPending && <Skeleton h={112} />}
							{active.map((org) => (
								<OrganizationTile
									key={org.id}
									url={`/tickets/${org.id}`}
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
											url={`/tickets/${org.id}`}
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

export default TicketOrganizationsPage;