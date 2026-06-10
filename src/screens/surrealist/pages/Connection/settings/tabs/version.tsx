import { Stack } from "@mantine/core";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { ConfigurationVersion } from "../sections/version";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionVersionTab({ instanceQuery }: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const { mutateAsync } = useUpdateInstanceVersionMutation(instance);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const onUpdate = useStable((version: string) => {
		handleUpdate(version);
	});

	if (!instance) {
		return null;
	}

	return (
		<Stack>
			<PrimaryTitle fz={32}>Version</PrimaryTitle>

			<Section
				title="Version"
				description="Update your instance to a newer SurrealDB version"
			>
				<ConfigurationVersion
					instance={instance}
					variant="page"
					onUpdate={onUpdate}
					onClose={() => {}}
				/>
			</Section>
		</Stack>
	);
}
