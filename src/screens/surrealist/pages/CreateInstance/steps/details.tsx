import { Badge, Group, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { type ChangeEvent, useLayoutEffect } from "react";
import { Icon } from "~/components/Icon";
import { useAvailableInstanceVersions } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { iconCheck } from "~/util/icons";
import type { ProvisionStepProps } from "../types";

export function ProvisionDetailsStep({ details, setDetails }: ProvisionStepProps) {
	const versions = useAvailableInstanceVersions();

	const versionList = versions.map((ver) => ({
		value: ver,
		label: `SurrealDB ${ver}`,
	}));

	const updateName = useStable((event: ChangeEvent<HTMLInputElement>) => {
		setDetails((draft) => {
			draft.name = event.target.value;
		});
	});

	const updateVersion = useStable((value: string | null) => {
		setDetails((draft) => {
			draft.version = value ?? "";
		});
	});

	useLayoutEffect(() => {
		if (!details.version) {
			setDetails((draft) => {
				draft.version = versions[0];
			});
		}
	}, [details.version, versions, setDetails]);

	return (
		<SimpleGrid cols={2}>
			<TextInput
				label="Name"
				placeholder="Instance name"
				value={details.name}
				onChange={updateName}
				autoFocus
				error={
					details.name.length > 30 ? "Instance name cannot exceed 30 characters" : null
				}
			/>
			<Select
				label="Version"
				placeholder="Loading versions..."
				data={versionList}
				value={details.version}
				onChange={updateVersion}
				renderOption={(org) => (
					<Group gap="sm">
						{org.option.label}
						{versionList[0].value === org.option.value && (
							<Badge
								variant="light"
								color="violet"
								size="xs"
							>
								Latest
							</Badge>
						)}
						{org.checked && (
							<Icon
								path={iconCheck}
								c="bright"
							/>
						)}
					</Group>
				)}
			/>
		</SimpleGrid>
	);
}
