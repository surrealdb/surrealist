import { Button, Center, Group, Image, Stack, Text } from "@mantine/core";
import { PropsWithChildren } from "react";
import { navigate } from "wouter/use-browser-location";
import cloudImg from "~/assets/images/icons/cloud.webp";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { CloudOrganization } from "~/types";

export interface CloudAdminGuardProps {
	organisation: CloudOrganization;
}

export function CloudAdminGuard({
	organisation,
	children,
}: PropsWithChildren<CloudAdminGuardProps>) {
	const canManage = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);

	if (!canManage) {
		return (
			<Center
				h="90%"
				pos="relative"
			>
				<Stack align="center">
					<Image
						src={cloudImg}
						alt=""
						maw={125}
					/>
					<Text
						fz={30}
						fw={700}
					>
						Access Restricted
					</Text>
					<Text
						fz="xl"
						w="100%"
						maw={520}
						ta="center"
					>
						You do not have permissions to view that page or perform that action. Please
						contact your organisation administrator for assistance.
					</Text>
					<Group
						mt={42}
						w="100%"
						maw={450}
					>
						<Button
							flex={1}
							color="slate"
							variant="light"
							onClick={() => navigate(`/overview`)}
						>
							Return Home
						</Button>
					</Group>
				</Stack>
			</Center>
		);
	}

	return children;
}
