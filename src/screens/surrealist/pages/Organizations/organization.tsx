import {
	Anchor,
	Badge,
	BoxProps,
	Group,
	Paper,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconChevronRight, iconWarning } from "@surrealdb/ui";
import { PropsWithChildren } from "react";
import { isOrganisationRestricted, isOrganisationTerminated } from "~/cloud/helpers";
import { Spacer } from "~/components/Spacer";
import { useCloudProfile } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { plural } from "~/util/helpers";

export interface OrganizationTileProps extends BoxProps {
	organization: CloudOrganization;
	destination?: string | null;
}

export function OrganizationTile({
	organization,
	destination,
	children,
	...other
}: PropsWithChildren<OrganizationTileProps>) {
	const defaultOrg = useCloudProfile().default_org;
	const [, navigate] = useAbsoluteLocation();

	const handleManage = useStable(() => {
		navigate(`/o/${organization.id}/${destination ?? ""}`);
	});

	return (
		<UnstyledButton
			onClick={handleManage}
			{...other}
		>
			<Anchor variant="glow">
				<Paper
					p="lg"
					display="flex"
					style={{
						flexDirection: "column",
					}}
					withBorder
				>
					<Group
						wrap="nowrap"
						align="center"
					>
						<Stack gap="xs">
							<Stack gap={0}>
								<Group>
									<Text
										c="bright"
										fw={600}
										fz="xl"
									>
										{organization.name}
									</Text>
									{defaultOrg === organization.id && (
										<Tooltip label="This is your personal organisation and allows one free instance">
											<Badge
												color="violet"
												variant="light"
											>
												Personal
											</Badge>
										</Tooltip>
									)}
								</Group>
								<Text>{organization.plan.name}</Text>
							</Stack>
							<Spacer />
							<Group>
								{isOrganisationTerminated(organization) ? (
									<Badge
										color="orange"
										variant="transparent"
										px={0}
									>
										Terminated
									</Badge>
								) : isOrganisationRestricted(organization) ? (
									<Badge
										color="red"
										variant="light"
										leftSection={
											<Icon
												path={iconWarning}
												size="sm"
											/>
										}
									>
										Restricted
									</Badge>
								) : (
									<Badge
										color="violet"
										variant="transparent"
										px={0}
									>
										{organization.member_count}{" "}
										{plural(organization.member_count, "member")}
									</Badge>
								)}
								<Spacer />
								{organization.billing_provider === "aws_marketplace" && (
									<Tooltip label="This organisation is managed by AWS Marketplace">
										<Badge
											color="slate"
											variant="light"
											mr={-42}
										>
											AWS Marketplace
										</Badge>
									</Tooltip>
								)}
							</Group>
						</Stack>
						<Spacer />
						<Icon
							c="dimmed"
							path={iconChevronRight}
						/>
					</Group>
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}
