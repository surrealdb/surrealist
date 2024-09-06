import { Button, Group, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useImmer } from "use-immer";
import { ConnectionDetails } from "~/components/ConnectionDetails";
import { Entry } from "~/components/Entry";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { Connection, Template } from "~/types";
import { createBaseConnection } from "~/util/defaults";
import { newId } from "~/util/helpers";
import { iconCheck, iconDelete, iconFile, iconPlus } from "~/util/icons";
import { SettingsSection } from "../utilities";

const CAT = "templates";

function createPlaceholder() {
	const settings = useConfigStore.getState().settings;

	return {
		...createBaseConnection(settings),
		name: "New template",
	};
}

export function TemplatesTab() {
	const [templates, setTemplates] = useSetting(CAT, "list");
	const [details, setDetails] = useImmer<Connection>(createPlaceholder());
	const [showEditor, showEditorHandle] = useDisclosure();

	const openCreator = useStable(() => {
		showEditorHandle.open();
		setDetails(createPlaceholder());
	});

	const openEditor = useStable((template: Template) => {
		showEditorHandle.open();
		setDetails({
			...createPlaceholder(),
			id: template.id,
			name: template.name,
			icon: template.icon,
			authentication: template.values,
			group: template.group,
		});
	});

	const saveTemplate = useStable(() => {
		const draft = [...templates];

		const template: Template = {
			id: details.id,
			name: details.name,
			icon: details.icon,
			group: details.group || undefined,
			values: details.authentication,
		};

		if (details.id) {
			const index = draft.findIndex((t) => t.id === details.id);

			if (index >= 0) {
				draft[index] = template;
			}
		} else {
			draft.push({
				...template,
				id: newId(),
			});
		}

		setTemplates(draft);
		showEditorHandle.close();
	});

	const deleteConnection = useStable(() => {
		const draft = [...templates];
		const index = draft.findIndex((t) => t.id === details.id);

		if (index >= 0) {
			draft.splice(index, 1);
			setTemplates(draft);
			showEditorHandle.close();
		}
	});

	return (
		<>
			<SettingsSection>
				<Text mb="xs">
					Templates simplify the process of creating new connections
					by pre-filling common connection details.
				</Text>

				{templates.map((template) => (
					<Entry
						key={template.id}
						variant="filled"
						onClick={() => openEditor(template)}
						leftSection={<Icon path={iconFile} />}
					>
						{template.name}
					</Entry>
				))}

				<Entry
					variant="subtle"
					onClick={openCreator}
					leftSection={<Icon path={iconPlus} />}
				>
					New template
				</Entry>
			</SettingsSection>

			<Modal
				opened={showEditor}
				onClose={showEditorHandle.close}
				trapFocus={false}
				size="lg"
			>
				<Form onSubmit={saveTemplate}>
					<ConnectionDetails value={details} onChange={setDetails} />

					<Group mt="lg">
						<Button
							color="slate"
							variant="light"
							onClick={showEditorHandle.close}
						>
							Close
						</Button>
						<Spacer />
						{details.id && (
							<Button
								color="pink.9"
								onClick={deleteConnection}
								leftSection={<Icon path={iconDelete} />}
							>
								Remove
							</Button>
						)}
						<Button
							type="submit"
							variant="gradient"
							rightSection={
								<Icon
									path={details.id ? iconCheck : iconPlus}
								/>
							}
						>
							{details.id ? "Save" : "Create"}
						</Button>
					</Group>
				</Form>
			</Modal>
		</>
	);
}
