import { Button, Divider, Group, Stack, Text, Textarea } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconDatabase, iconNamespace } from "@surrealdb/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import {
	invalidateDatabaseHierarchy,
	setDatabaseComment,
	setNamespaceComment,
} from "~/util/databases";
import { syncConnectionSchema } from "~/util/schema";

export type ResourceDescriptionKind = "namespace" | "database";

export interface EditResourceDescriptionOptions {
	kind: ResourceDescriptionKind;
	name: string;
	namespace?: string;
	comment?: string;
}

export function openEditResourceDescriptionModal(options: EditResourceDescriptionOptions) {
	openModal({
		modalId: `edit-resource-description-${options.kind}-${options.name}`,
		title: <PrimaryTitle>Edit description</PrimaryTitle>,
		withCloseButton: true,
		children: <EditResourceDescriptionModal {...options} />,
	});
}

function EditResourceDescriptionModal({
	kind,
	name,
	namespace,
	comment,
}: EditResourceDescriptionOptions) {
	const queryClient = useQueryClient();
	const [connectionId] = useConnection((c) => [c?.id ?? ""]);
	const [description, setDescription] = useInputState(comment ?? "");

	const handleClose = useStable(() => {
		closeModal(`edit-resource-description-${kind}-${name}`);
	});

	const submitMutation = useMutation({
		mutationFn: async () => {
			const value = description.trim() || undefined;

			if (kind === "namespace") {
				await setNamespaceComment(name, value);
				await syncConnectionSchema({ clearRoot: true });
			} else {
				if (!namespace) {
					return;
				}

				await setDatabaseComment(namespace, name, value);
				await syncConnectionSchema({ clearNamespace: true });
			}

			await invalidateDatabaseHierarchy(queryClient, connectionId);
			handleClose();
		},
	});

	const resourceLabel = kind === "namespace" ? "namespace" : "database";

	return (
		<Form onSubmit={submitMutation.mutate}>
			<Stack gap="xl">
				<Text>
					Update the description for this {resourceLabel}. Leave empty to remove the
					description.
				</Text>

				<Divider mx="-xl" />

				<Group gap="sm">
					<Icon path={kind === "namespace" ? iconNamespace : iconDatabase} />
					<Text
						fw={600}
						className="selectable"
					>
						{name}
					</Text>
				</Group>

				<Textarea
					label="Description"
					placeholder={`A description of the ${resourceLabel} (optional)`}
					value={description}
					onChange={setDescription}
					data-autofocus
					minRows={3}
				/>

				<Divider mx="-xl" />

				<Group justify="flex-end">
					<Button
						onClick={handleClose}
						color="obsidian"
						variant="light"
					>
						Cancel
					</Button>
					<Button
						loading={submitMutation.isPending}
						variant="gradient"
						type="submit"
					>
						Save
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
