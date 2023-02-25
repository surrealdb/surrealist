import { ActionIcon, Button, Checkbox, Collapse, Group, ScrollArea, Select, SimpleGrid, Stack, Textarea, TextInput } from "@mantine/core";
import { ChangeEvent, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useSaveBox } from "~/hooks/save";
import { useIsLight } from "~/hooks/theme";
import { TableDefinition } from "~/typings";
import { SectionDivider } from "./divider";
import { Section } from "./section";
import { buildDefinitionQueries, QUERY_STYLE, TABLE_TYPES } from "./helpers";
import { showError } from "~/util/helpers";
import { getActiveSurreal } from "~/surreal";
import { fetchDatabaseSchema } from "~/util/schema";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { mdiCheck, mdiClose } from "@mdi/js";
import { PermissionInput } from "./inputs";

export interface BuilderTabProps {
	table: TableDefinition;
}

export function BuilderTab(props: BuilderTabProps) {
	const isLight = useIsLight();
	const [data, setData] = useImmer(props.table!);

	const saveBox = useSaveBox({
		track: data!,
		onSave(original) {
			console.log(original);
			console.log(data);

			if (!original?.schema) {
				showError('Save failed', 'Could not determine previous state');
				return;
			}

			const query = buildDefinitionQueries(original, data);
			const surreal = getActiveSurreal();

			console.log('executing', query);

			surreal.query(query).then(() => {
				fetchDatabaseSchema();
			});
		},
		onRevert(original) {
			setData(original);
		},
	});

	useEffect(() => {
		setData(props.table!);
		saveBox.skip();
	}, [props.table]);

	const updateHasView = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const newIsView = e.currentTarget.checked;

		if (newIsView) {
			setData(draft => {
				draft.schema.view = {
					expr: '',
					what: '',
					cond: '',
					group: ''
				};
			});
		} else {
			setData(draft => {
				draft.schema.view = null;
			});
		}
	});

	return (
		<ScrollArea
			style={{ position: 'absolute', inset: 12, top: 0 }}
		>
			<Stack pt="sm" pb={125} px="sm">
				<Section
					isLight={isLight}
					title="General"
					description="General structural information about the table"
				>
					<Stack>
						<Select
							data={TABLE_TYPES}
							label="Table Type"
							value={data.schema.schemafull ? 'schemafull' : 'schemaless'}
							onChange={(value) => setData(draft => {
								draft.schema.schemafull = value === 'schemafull';
							})}
						/>
						<Checkbox
							label="Drop writes to this table"
							checked={data.schema.drop}
							onChange={(e) => setData(draft => {
								draft.schema.drop = e.currentTarget.checked;
							})}
						/>
						<div>
							<Checkbox
								label="Use table as view"
								checked={!!data.schema.view}
								onChange={updateHasView}
							/>
							<Collapse in={!!data.schema.view}>
								<Stack pt="md">
									<TextInput
										required
										label="View projections"
										placeholder="*"
										styles={QUERY_STYLE}
										value={data.schema.view?.expr}
										onChange={(e) => setData(draft => {
											draft.schema.view!.expr = e.currentTarget.value;
										})}
									/>
									<TextInput
										required
										label="View source"
										placeholder="table_name"
										styles={QUERY_STYLE}
										value={data.schema.view?.what}
										onChange={(e) => setData(draft => {
											draft.schema.view!.what = e.currentTarget.value;
										})}
									/>
									<TextInput
										label="View condition"
										placeholder="value > 10"
										styles={QUERY_STYLE}
										value={data.schema.view?.cond}
										onChange={(e) => setData(draft => {
											draft.schema.view!.cond = e.currentTarget.value;
										})}
									/>
									<TextInput
										label="View grouping"
										placeholder="field_name"
										styles={QUERY_STYLE}
										value={data.schema.view?.group}
										onChange={(e) => setData(draft => {
											draft.schema.view!.group = e.currentTarget.value;
										})}
									/>
								</Stack>
							</Collapse>
						</div>
					</Stack>
				</Section>

				<SectionDivider isLight={isLight} />

				<Section
					isLight={isLight}
					title="Permissions"
					description="Control read and write access to this table"
				>
					<Stack>
						<PermissionInput
							label="Create access"
							value={data.schema.permissions.create}
							onChange={(value) => setData(draft => {
								draft.schema.permissions.create = value;
							})}
						/>
						<PermissionInput
							label="Select access"
							value={data.schema.permissions.select}
							onChange={(value) => setData(draft => {
								draft.schema.permissions.select = value;
							})}
						/>
						<PermissionInput
							label="Update access"
							value={data.schema.permissions.update}
							onChange={(value) => setData(draft => {
								draft.schema.permissions.update = value;
							})}
						/>
						<PermissionInput
							label="Delete access"
							value={data.schema.permissions.delete}
							onChange={(value) => setData(draft => {
								draft.schema.permissions.delete = value;
							})}
						/>
					</Stack>
				</Section>

				<SectionDivider isLight={isLight} />

				<Section
					isLight={isLight}
					title="Fields"
					description="Definitions for the individual fields within the table"
				>
					<Stack>
						<TextInput placeholder="Reeeee" />
						<TextInput placeholder="Reeeee" />
						<TextInput placeholder="Reeeee" />
					</Stack>
				</Section>

				<SectionDivider isLight={isLight} />

				<Section
					isLight={isLight}
					title="Indexes"
					description="Define indexes for the table for commonly filtered fields"
				>
					<Stack>
						<TextInput placeholder="Reeeee" />
						<TextInput placeholder="Reeeee" />
						<TextInput placeholder="Reeeee" />
					</Stack>
				</Section>

				<SectionDivider isLight={isLight} />

				<Section
					isLight={isLight}
					title="Events"
					description="Create events to trigger when certain actions are performed on the table"
				>
					<Stack>
						<TextInput placeholder="Reeeee" />
						<TextInput placeholder="Reeeee" />
						<TextInput placeholder="Reeeee" />
					</Stack>
				</Section>
			</Stack>

			{saveBox.render}
		</ScrollArea>
	)
}