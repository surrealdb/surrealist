import { Grid, Select, Stack, Text, TextInput } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { ProvisionStepProps } from "../types";
import { useCloudStore } from "~/stores/cloud";
import { useAvailableInstanceVersions, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useLayoutEffect, type ChangeEvent } from "react";
import { StepActions } from "../actions";

export function ProvisionDetailsStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const organizations = useCloudStore((s) => s.organizations);
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
				draft.version = versions.at(-1) ?? "";
			});
		}
	}, [details.version, versions, setDetails]);

	return (
		<Stack>
			<PrimaryTitle>Instance details</PrimaryTitle>

			<Text mb="lg">
				Please enter a name for your new instance, and select the organization you would
				like to create it under.
			</Text>

			<Grid
				mb="xl"
				styles={{
					col: { alignContent: "center" },
				}}
			>
				<Grid.Col span={4}>
					<Text>Instance name</Text>
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
					<Text>SurrealDB Version</Text>
				</Grid.Col>
				<Grid.Col span={8}>
					<Select
						data={versionList}
						value={details.version}
						onChange={updateVersion}
					/>
				</Grid.Col>
			</Grid>

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={onContinue}
				disabled={!details.name || !details.version}
			/>
		</Stack>
	);
}
