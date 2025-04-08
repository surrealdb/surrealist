import classes from "./style.module.scss";

import {
	ActionIcon,
	Badge,
	Box,
	BoxProps,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";

import { PropsWithChildren, useMemo, useRef } from "react";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { CloudOrganization } from "~/types";
import { ON_STOP_PROPAGATION, plural, showInfo } from "~/util/helpers";
import { iconDelete, iconDotsVertical, iconExitToAp, iconPackageClosed } from "~/util/icons";

export interface OrganizationTileProps extends BoxProps {
	organization: CloudOrganization;
}

export function OrganizationTile({
	organization,
	children,
	...other
}: PropsWithChildren<OrganizationTileProps>) {
	const userId = useCloudStore((s) => s.userId);
	const membersQuery = useCloudMembersQuery(organization.id);
	const containerRef = useRef<HTMLDivElement>(null);
	const [, navigate] = useAbsoluteLocation();

	const members = membersQuery.isSuccess ? membersQuery.data : [];

	const isOwner = useMemo(() => {
		return members.some((member) => member.user_id === userId && member.role === "owner");
	}, [members, userId]);

	const handleManage = useStable(() => {
		navigate(`/o/${organization.id}`);
	});

	const handleCopyID = useStable(() => {
		navigator.clipboard.writeText(organization.id).then(() => {
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied organization id to clipboard",
			});
		});
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
						<Text>{organization.plan.name}</Text>
						<Spacer />
						<Badge
							color="violet"
							variant="subtle"
							px={0}
						>
							{members.length} {plural(members.length, "member")}
						</Badge>
					</Stack>
					<div
						onClick={ON_STOP_PROPAGATION}
						onKeyDown={ON_STOP_PROPAGATION}
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
								<Menu.Item onClick={handleCopyID}>Copy organization ID</Menu.Item>
								<Menu.Divider />
								{isOwner ? (
									<Menu.Item
										leftSection={
											<Icon
												path={iconPackageClosed}
												c="red"
											/>
										}
										onClick={() => {}}
										disabled
										c="red"
									>
										Archive organization
									</Menu.Item>
								) : (
									<Menu.Item
										leftSection={
											<Icon
												path={iconExitToAp}
												c="red"
											/>
										}
										onClick={() => {}}
										disabled
										c="red"
									>
										Leave organization
									</Menu.Item>
								)}
							</Menu.Dropdown>
						</Menu>
					</div>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
