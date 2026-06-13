import { ActionIcon, Button, Center, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { Icon, iconPause, iconPlay } from "@surrealdb/ui";
import { hasOrganizationRoles, ORG_ROLES_OWNER } from "~/cloud/helpers";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useResumeInstance } from "~/hooks/cloud";
import { CloudInstance, CloudOrganization } from "~/types";

export interface ResumelockProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

export function ResumeBlock({ instance, organisation }: ResumelockProps) {
	const canResume = hasOrganizationRoles(organisation, ORG_ROLES_OWNER);
	const resumeInstance = useResumeInstance(instance);

	return (
		<Paper p="xl">
			<Center h="100%">
				<Stack
					align="center"
					gap={0}
				>
					<ActionIcon
						size="xl"
						color="violet"
						variant="light"
					>
						<Icon path={iconPause} />
					</ActionIcon>
					<PrimaryTitle mt="xl">This instance is paused</PrimaryTitle>
					<Text>Resume your instance to continue where you left off.</Text>
					<Tooltip
						label="Ask your organization owner to resume this instance"
						disabled={canResume}
					>
						<Button
							mt="xl"
							size="xs"
							variant="gradient"
							disabled={!canResume}
							rightSection={
								<Icon
									path={iconPlay}
									size="sm"
								/>
							}
							onClick={() => {
								if (organisation.resources_locked) {
									openResourcesLockedModal(organisation);
								} else {
									resumeInstance();
								}
							}}
						>
							Resume instance
						</Button>
					</Tooltip>
				</Stack>
			</Center>
		</Paper>
	);
}
