import { Menu } from "@mantine/core";
import { Icon, iconBug, iconDelete, iconOrganization } from "@surrealdb/ui";
import { PropsWithChildren } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useDeleteContext } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { CloudContext, CloudOrganization } from "~/types";
import { showInfo } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { openResourcesLockedModal } from "../App/modals/resources-locked";

export interface ContextActionsProps {
	context: CloudContext;
	organisation: CloudOrganization;
}

export function ContextActions({
	context,
	organisation,
	children,
}: PropsWithChildren<ContextActionsProps>) {
	const canModify = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const handleCopyID = useStable(() => {
		navigator.clipboard.writeText(context.id).then(() => {
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied context id to clipboard",
			});
		});
	});

	const handleDelete = useDeleteContext(context);

	return (
		<Menu
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>{children}</Menu.Target>
			<Menu.Dropdown>
				<Link href={`/o/${context.organization_id}`}>
					<Menu.Item leftSection={<Icon path={iconOrganization} />}>
						View organisation
					</Menu.Item>
				</Link>
				<Menu.Item
					leftSection={<Icon path={iconBug} />}
					onClick={() => {
						dispatchIntent("create-message", {
							type: "conversation",
							organisation: organisation.id,
							message: `Hello! I would like to report an issue regarding my Spectron context (ID: ${context.id})`,
							conversationType: "context-issue",
						});
					}}
				>
					Report an issue
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item onClick={handleCopyID}>Copy context ID</Menu.Item>
				{canModify && (
					<>
						<Menu.Divider />
						<Menu.Item
							leftSection={
								<Icon
									path={iconDelete}
									c="red"
								/>
							}
							onClick={() => {
								if (organisation.resources_locked) {
									openResourcesLockedModal(organisation);
								} else {
									handleDelete();
								}
							}}
							c="red"
						>
							Delete context
						</Menu.Item>
					</>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
