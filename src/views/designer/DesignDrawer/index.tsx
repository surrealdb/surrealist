import classes from "./style.module.scss";

import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Button,
	Drawer,
	Group,
	Modal,
	Paper,
	ScrollArea,
	Text,
	TextInput,
} from "@mantine/core";

import { MouseEvent, useMemo, useState } from "react";
import { Updater } from "use-immer";
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
import { ChangefeedElement } from "./elements/changefeed";
import { getSurreal } from "~/util/surreal";
import { SaveBox } from "~/components/SaveBox";
import { SaveableHandle } from "~/hooks/save";
import { themeColor } from "~/util/mantine";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { iconClose, iconDelete, iconWrench } from "~/util/icons";

const INITIAL_TABS = ["general"];

export interface SchemaDrawerProps {
	opened: boolean;
	value: TableDefinition;
	onChange: Updater<TableDefinition>;
	handle: SaveableHandle<any>;
	onClose: (force?: boolean) => void;
}

export function DesignDrawer({ opened, value, onChange, handle, onClose }: SchemaDrawerProps) {
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
		onClose(true);

		await surreal.query(`REMOVE TABLE ${value.schema.name}`);

		fetchDatabaseSchema();
	});

	const isEdge = useMemo(() => isEdgeTable(value), [value]);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size="lg"
		>
			<Group mb="md" gap="sm">
				<ModalTitle>
					<Icon path={iconWrench} left size="sm" />
					Table designer
				</ModalTitle>

				<Spacer />

				{handle.isChanged && (handle.isSaveable ? (
					<Badge color="blue" variant="light">
						Unsaved changes
					</Badge>
				) : (
					<Badge color="red" variant="light">
						Missing required fields
					</Badge>
				))}

				<ActionIcon title="Delete table (Hold shift to force)" onClick={requestDelete}>
					<Icon color={isShifting ? "red" : undefined} path={iconDelete} />
				</ActionIcon>

				<ActionIcon onClick={() => onClose(false)} disabled={handle.isChanged}>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
			<TextInput
				mb="xs"
				readOnly
				value={value.schema.name}
				onFocus={ON_FOCUS_SELECT}
				rightSectionWidth={76}
				rightSection={
					isEdge && (
						<Paper
							title="This table is an edge"
							bg={isLight ? "slate.0" : "slate.6"}
							c={isLight ? "slate.6" : "white"}
							px="xs">
							Edge
						</Paper>
					)
				}
				styles={{
					input: {
						backgroundColor: isLight ? "white" : themeColor("dark.9"),
						color: "surreal",
						fontFamily: "JetBrains Mono",
						fontSize: 14,
						height: 42,
					}
				}}
			/>
			<ScrollArea style={{ position: "absolute", inset: 12, top: 114, bottom: 12 }}>
				<Accordion
					multiple
					defaultValue={INITIAL_TABS}
					chevronPosition="left"
				>
					<GeneralElement
						data={value}
						setData={onChange}
					/>

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
					<SaveBox
						handle={handle}
						inline
						inlineProps={{
							className: classes.saveBox
						}}
					/>
				</Box>
			</ScrollArea>

			<Modal
				opened={isDeleting}
				onClose={closeDelete}
				title={<ModalTitle>Are you sure?</ModalTitle>}
			>
				<Text>
					You are about to delete this table and all data contained within it. This action cannot be undone.
				</Text>
				<Group mt="lg">
					<Button
						onClick={closeDelete}
						color="slate"
						variant="light"
					>
						Close
					</Button>
					<Spacer />
					<Button
						color="red"
						onClick={handleDelete}
					>
						Delete
					</Button>
				</Group>
			</Modal>
		</Drawer>
	);
}
