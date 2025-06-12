import classes from "./style.module.scss";

import {
	ActionIcon,
	Badge,
	BoxProps,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";

import { PropsWithChildren, useMemo, useRef } from "react";
import { useRemoveMemberMutation } from "~/cloud/mutations/remove";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useCloudProfile } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { CloudOrganization } from "~/types";
import { ON_STOP_PROPAGATION, plural, showInfo } from "~/util/helpers";
import { iconDotsVertical, iconExitToAp } from "~/util/icons";

export interface OrganizationTileProps extends BoxProps {
	organization: CloudOrganization;
}

export function OrganizationTile({
	organization,
	children,
	...other
}: PropsWithChildren<OrganizationTileProps>) {
	const client = useQueryClient();
	const userId = useCloudStore((s) => s.userId);
	const defaultOrg = useCloudProfile().default_org;
	const membersQuery = useCloudMembersQuery(organization.id);
	const removeMutation = useRemoveMemberMutation(organization.id);
	const containerRef = useRef<HTMLDivElement>(null);
	const [, navigate] = useAbsoluteLocation();

	const isOwner = useMemo(() => {
		const members = membersQuery.data || [];

		return members.some((member) => member.user_id === userId && member.role === "owner");
	}, [membersQuery.data, userId]);

	const handleManage = useStable(() => {
		navigate(`/o/${organization.id}`);
	});

	const handleCopyID = useStable(() => {
		navigator.clipboard.writeText(organization.id).then(() => {
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied organisation id to clipboard",
			});
		});
	});

	const requestLeave = useConfirmation({
		title: "Leave organisation",
		message: "Are you sure you want to leave this organisation?",
		confirmText: "Leave",
		onConfirm: async () => {
			await removeMutation.mutateAsync(userId);

			showInfo({
				title: "Left organisation",
				subtitle: "You have successfully left the organisation.",
			});

			client.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});
		},
	});

	return (
		<UnstyledButton
			onClick={handleManage}
			{...other}
		>
			<Paper
				p="lg"
				className={classes.organizationBox}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					align="strech"
					flex={1}
				>
					<Stack
						gap={0}
						flex={1}
					>
						<Group>
							<Text
								c="bright"
								fw={600}
								fz="xl"
							>
								{organization.name}
							</Text>
						</Group>
						<Group gap="xs">
							<Text>{organization.plan.name}</Text>
							{defaultOrg === organization.id && (
								<>
									<Text c="slate">&mdash;</Text>
									<Tooltip label="This is your personal organisation and allows one free instance">
										<Text c="surreal">Personal</Text>
									</Tooltip>
								</>
							)}
						</Group>
						<Spacer />
						{organization.archived_at ? (
							<Badge
								color="orange"
								variant="transparent"
								px={0}
							>
								Archived
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
					</Stack>
					<Stack
						gap={0}
						onClick={ON_STOP_PROPAGATION}
						onKeyDown={ON_STOP_PROPAGATION}
						align="end"
					>
						<Menu
							transitionProps={{
								transition: "scale-y",
							}}
						>
							<Menu.Target>
								<ActionIcon
									color="slate"
									variant="subtle"
									component="div"
								>
									<Icon path={iconDotsVertical} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item onClick={handleCopyID}>Copy organisation ID</Menu.Item>
								{!isOwner && (
									<>
										<Menu.Divider />
										<Menu.Item
											leftSection={
												<Icon
													path={iconExitToAp}
													c="red"
												/>
											}
											onClick={requestLeave}
											c="red"
										>
											Leave organisation
										</Menu.Item>
									</>
								)}
							</Menu.Dropdown>
						</Menu>
					</Stack>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
