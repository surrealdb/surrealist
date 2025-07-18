import cloudImg from "~/assets/images/icons/cloud.webp";

import { Button, Center, Group, Stack, Text } from "@mantine/core";
import { Image } from "@mantine/core";
import { PropsWithChildren } from "react";
import { navigate } from "wouter/use-browser-location";
import { useHasOrganizationRole } from "~/cloud/hooks/role";

export interface CloudAdminGuardProps {
	organizationId: string;
}

export function CloudAdminGuard({
	organizationId,
	children,
}: PropsWithChildren<CloudAdminGuardProps>) {
	const canManage = organizationId && useHasOrganizationRole(organizationId, "admin");

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
