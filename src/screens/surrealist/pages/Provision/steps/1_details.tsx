import { Grid, Paper, Select, Stack, Text, TextInput } from "@mantine/core";
import { type ChangeEvent, useLayoutEffect } from "react";
import { useAvailableInstanceVersions, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { StepActions, StepTitle } from "../actions";
import type { ProvisionStepProps } from "../types";
import { useCloudStore } from "~/stores/cloud";
import { useOrganizationSelection } from "~/cloud/hooks/organizations";

export function ProvisionDetailsStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const { setSelectedOrganization } = useCloudStore.getState();

	const organization = useOrganization();
	const versions = useAvailableInstanceVersions();
	const organizations = useOrganizationSelection();

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
				draft.version = versions.at(-1) ?? "";
			});
		}
	}, [details.version, versions, setDetails]);

	return (
		<Stack>
			<StepTitle
				title="Information"
				description="Please enter a name and select a version for your new instance"
			/>

			<Paper p="xl">
				<Grid
					styles={{
						col: { alignContent: "center" },
					}}
				>
					<Grid.Col span={4}>
						<Text
							c="bright"
							fw={500}
						>
							Instance name
						</Text>
					</Grid.Col>
					<Grid.Col span={8}>
						<TextInput
							placeholder="Instance name"
							value={details.name}
							onChange={updateName}
							autoFocus
						/>
					</Grid.Col>
					<Grid.Col span={4}>
						<Text
							c="bright"
							fw={500}
						>
							Organization
						</Text>
					</Grid.Col>
					<Grid.Col span={8}>
						<Select
							data={organizations}
							value={organization?.id ?? ""}
							onChange={setSelectedOrganization as any}
						/>
					</Grid.Col>
					<Grid.Col span={4}>
						<Text
							c="bright"
							fw={500}
						>
							SurrealDB Version
						</Text>
					</Grid.Col>
					<Grid.Col span={8}>
						<Select
							data={versionList}
							value={details.version}
							onChange={updateVersion}
						/>
					</Grid.Col>
				</Grid>
			</Paper>
			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={onContinue}
				disabled={!details.name || !details.version}
			/>
		</Stack>
	);
}
