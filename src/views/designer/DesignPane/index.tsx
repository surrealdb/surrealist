import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Modal,
	Paper,
	ScrollArea,
	Text,
	TextInput,
} from "@mantine/core";

import { mdiClose, mdiDelete, mdiWrench } from "@mdi/js";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { Panel } from "~/components/Panel";
import { useSaveBox } from "~/hooks/save";
import { useStable } from "~/hooks/stable";
import { TableDefinition } from "~/types";
import { showError } from "~/util/helpers";
import { fetchDatabaseSchema, isEdgeTable } from "~/util/schema";
import { buildDefinitionQueries, isSchemaValid } from "./helpers";
import { Icon } from "~/components/Icon";
import { useActiveKeys } from "~/hooks/keys";
import { useIsLight } from "~/hooks/theme";
import { Spacer } from "~/components/Spacer";
import { GeneralElement } from "./elements/general";
import { PermissionsElement } from "./elements/permissions";
import { FieldsElement } from "./elements/fields";
import { IndexesElement } from "./elements/indexes";
import { EventsElement } from "./elements/events";
import { ModalTitle } from "~/components/ModalTitle";
import { ViewElement } from "./elements/view";
import { ChangefeedElement } from "./elements/changefeed";
import { getActiveSurreal, getSurreal } from "~/util/connection";

const INITIAL_TABS = ["general", "view", "changefeed", "permissions", "fields", "indexes", "events"];

export interface SchemaPaneProps {
	table: TableDefinition;
	onClose: () => void;
}

export function DesignPane(props: SchemaPaneProps) {
	const isLight = useIsLight();
	const [data, setData] = useImmer(props.table!);
	const isShifting = useActiveKeys("Shift");
	const isValid = data ? isSchemaValid(data) : true;
	const [isDeleting, setIsDeleting] = useState(false);
	const [isChanged, setIsChanged] = useState(false);

	const saveBox = useSaveBox({
		track: data!,
		valid: !!isValid,
		onSave(original) {
			if (!original?.schema) {
				showError("Save failed", "Could not determine previous state");
				return;
			}

			const query = buildDefinitionQueries(original, data);
			const surreal = getActiveSurreal();

			surreal.query(query)
				.then(() => fetchDatabaseSchema())
				.catch((err) => {
					showError("Failed to apply schema", err.message);
				});
		},
		onRevert(original) {
			setData(original);
		},
		onChangedState(value) {
			setIsChanged(value);
		},
	});

	useEffect(() => {
		setData(props.table!);
		saveBox.skip();
	}, [props.table]);

	const requestDelete = useStable((e: MouseEvent<HTMLButtonElement>) => {
		if (e.shiftKey) {
			handleDelete();
		} else {
			setIsDeleting(true);
		}
	});

	const closeDelete = useStable(() => {
		setIsDeleting(false);
	});

	const handleDelete = useStable(async () => {
		const surreal = getSurreal();

		if (!surreal || !props.table) {
			return;
		}

		setIsDeleting(false);
		props.onClose();

		await surreal.query(`REMOVE TABLE ${props.table.schema.name}`);

		fetchDatabaseSchema();
	});

	const isEdge = useMemo(() => isEdgeTable(props.table), [props.table]);

	return (
		<Panel
			icon={mdiWrench}
			title="Design"
			leftSection={
				isChanged &&
				(isValid ? (
					<Badge color={isLight ? "blue.6" : "blue.4"}>Changes not yet applied</Badge>
				) : (
					<Badge color={isLight ? "red.6" : "red.4"}>Missing required fields</Badge>
				))
			}
			rightSection={
				<Group noWrap>
					<ActionIcon onClick={requestDelete} title="Delete table (Hold shift to force)">
						<Icon color={isShifting ? "red" : "light.4"} path={mdiDelete} />
					</ActionIcon>

					<ActionIcon title="Refresh" onClick={props.onClose}>
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
				</Group>
			}>
			{data && (
				<>
					<TextInput
						mb="xs"
						readOnly
						value={props.table.schema.name}
						onFocus={(e) => e.target.select()}
						rightSectionWidth={76}
						rightSection={
							isEdge && (
								<Paper
									title="This table is an edge"
									bg={isLight ? "light.0" : "light.6"}
									c={isLight ? "light.6" : "white"}
									px="xs">
									Edge
								</Paper>
							)
						}
						styles={(theme) => ({
							input: {
								backgroundColor: isLight ? "white" : theme.fn.themeColor("dark.9"),
								color: "surreal",
								fontFamily: "JetBrains Mono",
								fontSize: 14,
								height: 42,
							},
						})}
					/>
					<ScrollArea style={{ position: "absolute", inset: 12, top: 56, bottom: 68 }}>
						<Accordion
							multiple
							defaultValue={INITIAL_TABS}
							chevronPosition="left"
						>
							<GeneralElement
								data={data}
								setData={setData}
							/>

							{data.schema.view && (
								<ViewElement
									data={data}
									setData={setData}
								/>
							)}

							{data.schema.changefeed && (
								<ChangefeedElement
									data={data}
									setData={setData}
								/>
							)}

							<PermissionsElement
								data={data}
								setData={setData}
							/>

							<FieldsElement
								data={data}
								setData={setData}
							/>

							<IndexesElement
								data={data}
								setData={setData}
							/>

							<EventsElement
								data={data}
								setData={setData}
							/>
						</Accordion>
					</ScrollArea>

					<Box px="sm" pb="sm" pos="absolute" left={4} bottom={4} right={4}>
						{saveBox.render}
					</Box>
				</>
			)}

			<Modal
				opened={isDeleting}
				onClose={closeDelete}
				title={<ModalTitle>Are you sure?</ModalTitle>}
			>
				<Text color={isLight ? "light.6" : "light.1"}>
					You are about to delete this table and all data contained within it. This action cannot be undone.
				</Text>
				<Group mt="lg">
					<Button onClick={closeDelete} color={isLight ? "light.5" : "light.3"} variant="light">
						Close
					</Button>
					<Spacer />
					<Button color="red" onClick={handleDelete}>
						Delete
					</Button>
				</Group>
			</Modal>
		</Panel>
	);
}
