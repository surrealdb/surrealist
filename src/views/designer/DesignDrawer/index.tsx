import classes from "./style.module.scss";

import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Drawer,
	Group,
	Paper,
	ScrollArea,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { useMemo, useState } from "react";
import { Updater } from "use-immer";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import { executeQuery } from "~/connection";
import { SaveableHandle } from "~/hooks/save";
import { useIsLight } from "~/hooks/theme";
import { useConfirmation } from "~/providers/Confirmation";
import { TableInfo } from "~/types";
import { ON_FOCUS_SELECT, tb } from "~/util/helpers";
import { iconClose, iconDelete, iconWrench } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { isEdgeTable, syncDatabaseSchema } from "~/util/schema";
import { ChangefeedElement } from "./elements/changefeed";
import { EventsElement } from "./elements/events";
import { FieldsElement } from "./elements/fields";
import { GeneralElement } from "./elements/general";
import { IndexesElement } from "./elements/indexes";
import { PermissionsElement } from "./elements/permissions";

const INITIAL_TABS = ["general"];

export interface SchemaDrawerProps {
	opened: boolean;
	value: TableInfo;
	onChange: Updater<TableInfo>;
	handle: SaveableHandle;
	onClose: (force?: boolean) => void;
}

export function DesignDrawer({
	opened,
	value,
	onChange,
	handle,
	onClose,
}: SchemaDrawerProps) {
	const isLight = useIsLight();

	const removeTable = useConfirmation({
		message:
			"You are about to remove this table and all data contained within it. This action cannot be undone.",
		confirmText: "Remove",
		onConfirm: async () => {
			onClose(true);

			await executeQuery(`REMOVE TABLE ${tb(value.schema.name)}`);
			await syncDatabaseSchema({
				tables: [value.schema.name],
			});
		},
	});

	const isEdge = useMemo(() => isEdgeTable(value), [value]);

	const [width, setWidth] = useState(650);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size={width}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DrawerResizer minSize={500} maxSize={900} onResize={setWidth} />

			<Group mb="md" gap="sm">
				<ModalTitle>
					<Icon path={iconWrench} left size="sm" />
					Table designer
				</ModalTitle>

				<Spacer />

				{handle.isChanged &&
					(handle.isSaveable ? (
						<Badge color="blue" variant="light">
							Unsaved changes
						</Badge>
					) : (
						<Badge color="pink.7" variant="light">
							Missing required fields
						</Badge>
					))}

				<Tooltip label="Remove table">
					<ActionIcon
						onClick={removeTable}
						color="pink.7"
						aria-label="Remove table"
					>
						<Icon path={iconDelete} />
					</ActionIcon>
				</Tooltip>

				<ActionIcon
					onClick={() => onClose(false)}
					disabled={handle.isChanged}
					aria-label="Close designer drawer"
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
			<TextInput
				mb="xs"
				readOnly
				value={value.schema.name}
				spellCheck={false}
				onFocus={ON_FOCUS_SELECT}
				rightSectionWidth={76}
				rightSection={
					isEdge && (
						<Paper
							title="This table is an edge"
							bg={isLight ? "slate.0" : "slate.6"}
							c={isLight ? "slate.6" : "white"}
							px="xs"
						>
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
					},
				}}
			/>
			<ScrollArea mt="sm" flex="1 1 0">
				<Accordion
					multiple
					defaultValue={INITIAL_TABS}
					variant="separated"
					classNames={{
						item: classes.accordionItem,
						label: classes.accordionLabel,
					}}
				>
					<GeneralElement data={value} setData={onChange} />

					<PermissionsElement data={value} setData={onChange} />

					<ChangefeedElement data={value} setData={onChange} />

					<FieldsElement data={value} setData={onChange} />

					<IndexesElement data={value} setData={onChange} />

					<EventsElement data={value} setData={onChange} />
				</Accordion>
			</ScrollArea>
			<Box mt="lg">
				<SaveBox
					handle={handle}
					inline
					inlineProps={{
						className: classes.saveBox,
					}}
				/>
			</Box>
		</Drawer>
	);
}
