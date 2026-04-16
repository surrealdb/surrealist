import { Button, Group, Loader, Select, Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconOrganization } from "@surrealdb/ui";
import { useState } from "react";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import type { CloudOrganization } from "~/types";

const MODAL_ID = "select-organization";

export interface SelectOrganizationModalProps {
	title?: string;
	description?: string;
	action?: string;
	onSelect: (organization: CloudOrganization) => void;
}

export function openSelectOrganizationModal(props: SelectOrganizationModalProps) {
	openModal({
		modalId: MODAL_ID,
		title: (
			<Group>
				<Icon
					path={iconOrganization}
					c="bright"
				/>
				<PrimaryTitle>{props.title ?? "Select an organisation"}</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		children: <SelectOrganizationContent {...props} />,
	});
}

function SelectOrganizationContent({
	description,
	action,
	onSelect,
}: SelectOrganizationModalProps) {
	const { data: organizations, isLoading } = useCloudOrganizationsQuery();
	const [selected, setSelected] = useState<string | null>(null);

	const selectedOrg = organizations?.find((org) => org.id === selected);

	const handleClose = useStable(() => closeModal(MODAL_ID));

	const handleContinue = useStable(() => {
		if (selectedOrg) {
			handleClose();
			onSelect(selectedOrg);
		}
	});

	return (
		<Stack>
			{description && <Text>{description}</Text>}

			{isLoading ? (
				<Group justify="center">
					<Loader />
				</Group>
			) : (
				<Select
					label="Organisation"
					placeholder="Select an organisation"
					data={
						organizations?.map((org) => ({
							value: org.id,
							label: org.name,
						})) ?? []
					}
					value={selected}
					onChange={setSelected}
				/>
			)}

			<Group mt="md">
				<Button
					color="obsidian"
					variant="light"
					onClick={handleClose}
				>
					Close
				</Button>
				<Spacer />
				<Button
					variant="gradient"
					disabled={!selectedOrg}
					onClick={handleContinue}
				>
					{action ?? "Continue"}
				</Button>
			</Group>
		</Stack>
	);
}
