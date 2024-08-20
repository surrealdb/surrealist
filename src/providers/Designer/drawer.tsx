import classes from "./style.module.scss";

import {
	Accordion,
	ActionIcon,
	Alert,
	Badge,
	Box,
	Drawer,
	Group,
	Paper,
	ScrollArea,
	Tooltip,
} from "@mantine/core";

import { useState } from "react";
import { Updater } from "use-immer";
import { TableInfo } from "~/types";
import { syncDatabaseSchema } from "~/util/schema";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { GeneralElement } from "./elements/general";
import { PermissionsElement } from "./elements/permissions";
import { FieldsElement } from "./elements/fields";
import { IndexesElement } from "./elements/indexes";
import { EventsElement } from "./elements/events";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SaveBox } from "~/components/SaveBox";
import { SaveableHandle } from "~/hooks/save";
import { tb } from "~/util/helpers";
import { iconClose, iconDelete, iconDesigner, iconRelation, iconTable, iconWarning } from "~/util/icons";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/database/connection/connection";
import { ChangefeedElement } from "./elements/changefeed";
import { DrawerResizer } from "~/components/DrawerResizer";
import { useIsLight } from "~/hooks/theme";

const INITIAL_TABS = ["general"];

export interface SchemaDrawerProps {
	opened: boolean;
	value: TableInfo;
	onChange: Updater<TableInfo>;
	handle: SaveableHandle;
	errors: string[];
	onClose: (force?: boolean) => void;
}

export function DesignDrawer({
	opened,
	value,
	onChange,
	handle,
	errors,
	onClose
}: SchemaDrawerProps) {
	const isLight = useIsLight();
	const [width, setWidth] = useState(650);

	const removeTable = useConfirmation({
		message: "You are about to remove this table and all data contained within it. This action cannot be undone.",
		confirmText: "Remove",
		onConfirm:  async () => {
			onClose(true);

			await executeQuery(`REMOVE TABLE ${tb(value.schema.name)}`);
			await syncDatabaseSchema({
				tables: [value.schema.name]
			});
		}
	});

	const isEdge = value.schema.kind.kind === "RELATION";

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
					flexDirection: "column"
				}
			}}
		>
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
			/>

			<Group mb="md" gap="sm">
				<PrimaryTitle>
					<Icon left path={iconDesigner} size="sm" />
					Table designer
				</PrimaryTitle>

				<Spacer />

				{handle.isChanged && (handle.isSaveable ? (
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
			<Paper
				withBorder
				bg={isLight ? "white" : "slate.9"}
				p="sm"
				ff="monospace"
				mb="md"
			>
				<Group gap="sm">
					<Icon path={isEdge ? iconRelation : iconTable} />
					{value.schema.name}
				</Group>
			</Paper>
			<ScrollArea
				mt="sm"
				flex="1 1 0"
			>
				{errors.map((error, i) => (
					<Alert
						key={i}
						className={classes.error}
						icon={<Icon path={iconWarning} />}
						color="red.5"
						mb="xl"
						style={{
							whiteSpace: "pre-wrap"
						}}
					>
						{error}
					</Alert>
				))}
				<Accordion
					multiple
					defaultValue={INITIAL_TABS}
					variant="separated"
					classNames={{
						item: classes.accordionItem,
						label: classes.accordionLabel,
					}}
				>
					<GeneralElement
						data={value}
						setData={onChange}
					/>

					<PermissionsElement
						data={value}
						setData={onChange}
					/>

					<ChangefeedElement
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
			</ScrollArea>
			<Box mt="lg">
				<SaveBox
					handle={handle}
					inline
					inlineProps={{
						className: classes.saveBox
					}}
				/>
			</Box>
		</Drawer>
	);
}
