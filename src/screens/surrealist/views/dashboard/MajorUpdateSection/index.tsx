import { Anchor, Box, Button, Group, Image, Paper, Text } from "@mantine/core";
import { satisfies } from "compare-versions";
import { Link } from "wouter";
import surrealdbImg from "~/assets/images/icons/surrealdb.webp";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CloudInstance, CloudOrganization } from "~/types";
import { iconArrowUpRight } from "~/util/icons";

export interface MajorUpdateSectionProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

export function MajorUpdateSection({ instance, organisation }: MajorUpdateSectionProps) {
	const canUpdate = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const showUpdate = canUpdate && satisfies(instance.version, ">=2.6.1 <3.0.0-0");

	return (
		showUpdate && (
			<>
				<Box mt={32}>
					<PrimaryTitle>SurrealDB 3.0 is here!</PrimaryTitle>
					<Text>Enjoy the latest features and improvements</Text>
				</Box>
				<Paper>
					<Group pl="md">
						<Image
							src={surrealdbImg}
							w={112}
						/>
						<Box py="xl">
							<PrimaryTitle>Check compatibility</PrimaryTitle>
							<Text>
								Check if your database is compatible with SurrealDB 3.0 and start
								your migration.
							</Text>
							<Group mt="md">
								<Link href="migrations">
									<Button
										variant="gradient"
										size="xs"
									>
										Start migration
									</Button>
								</Link>
								<Anchor href="https://surrealdb.com/3.0">
									<Button
										variant="light"
										color="slate"
										size="xs"
										rightSection={<Icon path={iconArrowUpRight} />}
									>
										Learn more
									</Button>
								</Anchor>
							</Group>
						</Box>
					</Group>
				</Paper>
			</>
		)
	);
}
