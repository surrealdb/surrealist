import {
	iconCheck,
	iconCopy,
	iconDelete,
	iconDotsVertical,
	iconFile,
	iconPlus,
} from "~/util/icons";

import { ActionIcon, Box, Button, Group, Menu, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { type HTMLAttributes, type MouseEvent, useState } from "react";
import { useImmer } from "use-immer";
import { Entry, type EntryProps } from "~/components/Entry";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import type { Connection, Template } from "~/types";
import { createBaseConnection } from "~/util/defaults";
import { ON_STOP_PROPAGATION, newId, uniqueName } from "~/util/helpers";
import { SettingsSection } from "../utilities";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { USER_ICONS } from "~/util/user-icons";

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

		const existing = templates.map((t) => t.name);
		const name = uniqueName("New template", existing);

		setDetails({
			...createPlaceholder(),
			name: name,
		});
	});

	const openEditor = useStable((template: Template) => {
		showEditorHandle.open();
		setDetails({
			...createPlaceholder(),
			id: template.id,
			name: template.name,
			icon: template.icon,
			authentication: template.values,
		});
	});

	const saveTemplate = useStable(() => {
		const draft = [...templates];
		const index = draft.findIndex((t) => t.id === details.id);
		const template: Template = {
			id: details.id,
			name: details.name,
			icon: details.icon,
			values: details.authentication,
		};

		if (index >= 0) {
			draft[index] = template;
		} else {
			draft.push(template);
		}

		setTemplates(draft);
		showEditorHandle.close();
	});

	const handleRemove = useStable((template: Template) => {
		const index = templates.findIndex((t) => t.id === template.id);

		if (index >= 0) {
			setTemplates(templates.toSpliced(index, 1));
		}

		showEditorHandle.close();
	});

	const handleDuplicate = useStable((template: Template) => {
		const existing = templates.map((t) => t.name);
		const name = uniqueName(template.name, existing);

		setTemplates([
			...templates,
			{
				...template,
				id: newId(),
				name: name,
			},
		]);
	});

	return (
		<>
			<SettingsSection>
				<Text mb="xs">
					Connection templates make it easier to create new connections by pre-filling
					common connection details. <br />
					From the connection editor you can choose which template to use.
				</Text>

				{templates.map((template) => (
					<Item
						key={template.id}
						template={template}
						onOpen={openEditor}
						onRemove={handleRemove}
						onDuplicate={handleDuplicate}
					/>
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
			>
				<Form onSubmit={saveTemplate}>
					<Stack gap="xl">
						<Box>
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Connection
							</Text>
							<Text>Specify an icon and name for this template</Text>
						</Box>

						<ConnectionNameDetails
							value={details}
							onChange={setDetails}
						/>

						<Box mt="xl">
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Remote address
							</Text>
							<Text>
								Select a communication protocol and specify instance address
							</Text>
						</Box>

						<ConnectionAddressDetails
							value={details}
							onChange={setDetails}
						/>

						<Box mt="xl">
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Authentication
							</Text>
							<Text>Specify default authentication details</Text>
						</Box>

						<ConnectionAuthDetails
							value={details}
							onChange={setDetails}
						/>

						<Box mt="xl">
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Labels
							</Text>
							<Text>Add default labels to this template</Text>
						</Box>

						<ConnectionLabelsDetails
							value={details}
							onChange={setDetails}
						/>

						<Group mt="xl">
							<Button
								color="slate"
								variant="light"
								onClick={showEditorHandle.close}
							>
								Close
							</Button>
							<Spacer />
							<Button
								type="submit"
								variant="gradient"
							>
								{details.id ? "Save changes" : "Create"}
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</>
	);
}

interface ItemProps extends EntryProps, Omit<HTMLAttributes<HTMLButtonElement>, "style" | "color"> {
	template: Template;
	onOpen: (template: Template) => void;
	onRemove: (template: Template) => void;
	onDuplicate: (template: Template) => void;
}

function Item({ template, onOpen, onRemove, onDuplicate, ...other }: ItemProps) {
	const [showOptions, setShowOptions] = useState(false);

	const activate = useStable(() => {
		onOpen(template);
	});

	const handleOptions = useStable((e: MouseEvent) => {
		e.stopPropagation();
		setShowOptions(true);
	});

	const handleDelete = useConfirmation({
		title: "Remove template",
		message: "Are you sure you want to remove this template?",
		skippable: true,
		onConfirm() {
			onRemove(template);
		},
	});

	const handleDuplicate = useStable(() => {
		onDuplicate(template);
	});

	return (
		<Entry
			key={template.id}
			onClick={activate}
			leftSection={<Icon path={USER_ICONS[template.icon]} />}
			rightSection={
				<Menu
					opened={showOptions}
					onChange={setShowOptions}
					transitionProps={{
						transition: "scale-y",
					}}
				>
					<Menu.Target>
						<ActionIcon
							component="div"
							variant="transparent"
							onClick={handleOptions}
							aria-label="Connection options"
						>
							<Icon path={iconDotsVertical} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown onClick={ON_STOP_PROPAGATION}>
						<Menu.Item
							leftSection={<Icon path={iconCopy} />}
							onClick={handleDuplicate}
						>
							Duplicate
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							leftSection={
								<Icon
									path={iconDelete}
									c="red"
								/>
							}
							onClick={handleDelete}
							c="red"
						>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			}
			{...other}
		>
			<Text truncate>{template.name}</Text>
		</Entry>
	);
}
