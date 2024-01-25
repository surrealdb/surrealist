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
import { MouseEvent, useMemo, useState } from "react";
import { Updater } from "use-immer";
import { Panel } from "~/components/Panel";
import { useStable } from "~/hooks/stable";
import { TableDefinition } from "~/types";
import { fetchDatabaseSchema, isEdgeTable } from "~/util/schema";
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
import { getSurreal } from "~/util/connection";
import { SaveBox } from "~/components/SaveBox";
import { SaveableHandle } from "~/hooks/save";

const INITIAL_TABS = ["general"];

export interface SchemaPaneProps {
	value: TableDefinition;
	onChange: Updater<TableDefinition>;
	handle: SaveableHandle<any>;
	onClose: () => void;
}

export function DesignPane({ value, onChange, handle, onClose }: SchemaPaneProps) {
	const isLight = useIsLight();
	const isShifting = useActiveKeys("Shift");
	
	const [isDeleting, setIsDeleting] = useState(false);

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

		if (!surreal) {
			return;
		}

		setIsDeleting(false);
		onClose();

		await surreal.query(`REMOVE TABLE ${value.schema.name}`);

		fetchDatabaseSchema();
	});

	const isEdge = useMemo(() => isEdgeTable(value), [value]);

	return (
		<Panel
			icon={mdiWrench}
			title="Design"
			leftSection={
				handle.isChanged && (handle.isSaveable ? (
					<Badge color={isLight ? "blue.6" : "blue.4"}>Unsaved changes</Badge>
				) : (
					<Badge color={isLight ? "red.6" : "red.4"}>Missing required fields</Badge>
				))
			}
			rightSection={
				<Group noWrap>
					<ActionIcon onClick={requestDelete} title="Delete table (Hold shift to force)">
						<Icon color={isShifting ? "red" : "light.4"} path={mdiDelete} />
					</ActionIcon>

					<ActionIcon title="Refresh" onClick={onClose}>
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
				</Group>
			}
		>
			<TextInput
				mb="xs"
				readOnly
				value={value.schema.name}
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
			<ScrollArea style={{ position: "absolute", inset: 12, top: 56, bottom: 12 }}>
				<Accordion
					multiple
					defaultValue={INITIAL_TABS}
					chevronPosition="left"
				>
					<GeneralElement
						data={value}
						setData={onChange}
					/>

					{value.schema.view && (
						<ViewElement
							data={value}
							setData={onChange}
						/>
					)}

					{value.schema.changefeed && (
						<ChangefeedElement
							data={value}
							setData={onChange}
						/>
					)}

					<PermissionsElement
						data={value}
						setData={onChange}
					/>

					<FieldsElement
						data={value}
						setData={onChange}
					/>

					<IndexesElement
						data={value}
						setData={onChange}
					/>

					<EventsElement
						data={value}
						setData={onChange}
					/>
				</Accordion>

				<Box mt="lg">
					<SaveBox handle={handle} inline />
				</Box>
			</ScrollArea>

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
