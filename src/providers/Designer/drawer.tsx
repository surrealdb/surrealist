import {
	Accordion,
	ActionIcon,
	Alert,
	Badge,
	Box,
	CopyButton,
	Drawer,
	Group,
	Paper,
	ScrollArea,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { capitalize } from "radash";
import { useState } from "react";
import { escapeIdent } from "surrealdb";
import type { Updater } from "use-immer";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import { TABLE_VARIANT_ICONS } from "~/constants";
import type { SaveableHandle } from "~/hooks/save";
import { useIsLight } from "~/hooks/theme";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import type { TableInfo } from "~/types";
import {
	iconCheck,
	iconClose,
	iconCopy,
	iconDelete,
	iconDesigner,
	iconWarning,
} from "~/util/icons";
import { getTableVariant, syncConnectionSchema } from "~/util/schema";
import { ChangefeedElement } from "./elements/changefeed";
import { EventsElement } from "./elements/events";
import { FieldsElement } from "./elements/fields";
import { GeneralElement } from "./elements/general";
import { IndexesElement } from "./elements/indexes";
import { PermissionsElement } from "./elements/permissions";
import classes from "./style.module.scss";

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
	onClose,
}: SchemaDrawerProps) {
	const { setOpenDesignerPanels } = useConfigStore.getState();

	const _isLight = useIsLight();
	const [width, setWidth] = useState(650);
	const openDesignerPanels = useConfigStore((s) => s.openDesignerPanels);

	const removeTable = useConfirmation({
		message:
			"You are about to remove this table and all data contained within it. This action cannot be undone.",
		confirmText: "Remove",
		skippable: true,
		onConfirm: async () => {
			onClose(true);

			await executeQuery(`REMOVE TABLE ${escapeIdent(value.schema.name)}`);
			await syncConnectionSchema({
				tables: [value.schema.name],
			});
		},
	});

	const variant = getTableVariant(value);

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
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
			/>

			<Group
				mb="md"
				gap="sm"
			>
				<PrimaryTitle>
					<Icon
						left
						path={iconDesigner}
						size="sm"
					/>
					Table designer
				</PrimaryTitle>

				<Spacer />

				{handle.isChanged &&
					(handle.isSaveable ? (
						<Badge
							color="blue"
							variant="light"
						>
							Unsaved changes
						</Badge>
					) : (
						<Badge
							color="pink.7"
							variant="light"
						>
							Missing required fields
						</Badge>
					))}

				<ActionButton
					color="pink.7"
					label="Remove table"
					onClick={removeTable}
				>
					<Icon path={iconDelete} />
				</ActionButton>

				<ActionButton
					label="Close drawer"
					disabled={handle.isChanged}
					onClick={() => onClose(false)}
				>
					<Icon path={iconClose} />
				</ActionButton>
			</Group>
			<Paper
				withBorder
				my="md"
				p="md"
			>
				<Group>
					<ThemeIcon
						radius="sm"
						color="violet"
						variant="light"
						size={38}
					>
						<Icon
							path={TABLE_VARIANT_ICONS[variant]}
							size="lg"
						/>
					</ThemeIcon>
					<Box>
						<Text
							fz="xl"
							fw={500}
							c="bright"
						>
							{value.schema.name}
						</Text>
						<Text>{capitalize(variant)} table</Text>
					</Box>
					<Spacer />
					<CopyButton value={value.schema.name}>
						{({ copied, copy }) => (
							<ActionIcon
								variant={copied ? "gradient" : "subtle"}
								onClick={copy}
								aria-label="Copy name to clipboard"
							>
								<Icon path={copied ? iconCheck : iconCopy} />
							</ActionIcon>
						)}
					</CopyButton>
				</Group>
			</Paper>
			<ScrollArea
				mt="sm"
				flex="1 1 0"
			>
				{errors.map((error) => (
					<Alert
						key={error}
						icon={<Icon path={iconWarning} />}
						color="red.5"
						mb="xl"
						style={{
							whiteSpace: "pre-wrap",
						}}
					>
						{error}
					</Alert>
				))}
				<Accordion
					multiple
					value={openDesignerPanels}
					onChange={setOpenDesignerPanels}
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
				{handle.isChanged && (
					<SaveBox
						handle={handle}
						inline
						withApply
					/>
				)}
			</Box>
		</Drawer>
	);
}
