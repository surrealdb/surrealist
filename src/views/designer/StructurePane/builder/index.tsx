import { Box, Checkbox, Collapse, MultiSelect, ScrollArea, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { ChangeEvent, useEffect } from "react";
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
import { PermissionInput } from "./inputs";
import { Lister } from "./lister";
import { GEOMETRY_TYPES, SURREAL_KINDS } from "~/constants";
import { useStoreValue } from "~/store";

export interface BuilderTabProps {
	table: TableDefinition;
	onChangedState: (isChanged: boolean) => void;
}

export function BuilderTab(props: BuilderTabProps) {
	const isLight = useIsLight();
	const [data, setData] = useImmer(props.table!);
	const tableList = useStoreValue(state => state.databaseSchema).map(t => t.schema.name);

	const saveBox = useSaveBox({
		track: data!,
		onSave(original) {
			if (!original?.schema) {
				showError('Save failed', 'Could not determine previous state');
				return;
			}

			const query = buildDefinitionQueries(original, data);
			const surreal = getActiveSurreal();

			console.log('executing', query);

			surreal.query(query).then(() => {
				fetchDatabaseSchema();
			}).catch(err => {
				showError('Failed to apply schema', err.message);
			});
		},
		onRevert(original) {
			setData(original);
		},
		onChangedState: props.onChangedState
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

	const addField = useStable(() => {
		setData(d => {
			d.fields.push({
				name: '',
				assert: '',
				flexible: false,
				kind: '',
				value: '',
				kindTables: [],
				kindGeometry: [],
				permissions: {
					create: 'FULL',
					select: 'FULL',
					update: 'FULL',
					delete: 'FULL'
				}
			})
		});
	});

	const removeField = useStable((index: number) => {
		setData(d => {
			d.fields.splice(index, 1);
		});
	});

	const addIndex = useStable(() => {
		setData(d => {
			d.indexes.push({
				name: '',
				fields: '',
				unique: false
			})
		});
	});

	const removeIndex = useStable((index: number) => {
		setData(d => {
			d.indexes.splice(index, 1);
		});
	});

	const addEvent = useStable(() => {
		setData(d => {
			d.events.push({
				name: '',
				cond: '',
				then: ''
			})
		});
	});

	const removeEvent = useStable((index: number) => {
		setData(d => {
			d.events.splice(index, 1);
		});
	});

	return (
		<ScrollArea
			style={{ position: 'absolute', inset: 12, top: 0 }}
		>
			<Stack pt="sm" pb={64} px="sm">
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
					<Lister
						value={data.fields}
						missing="No schema fields defined yet"
						name="field"
						onCreate={addField}
						onRemove={removeField}
					>
						{(field, i) => (
							<>
								<TextInput
									required
									autoFocus
									label="Field name"
									placeholder="field_name"
									value={field.name}
									onChange={(e) => setData(draft => {
										draft.fields[i].name = e.currentTarget.value;
									})}
								/>
								<Checkbox
									label="Is field flexible"
									checked={field.flexible}
									onChange={e => setData(draft => {
										draft.fields[i].flexible = e.currentTarget.checked;
									})}
								/>
								<SimpleGrid cols={field.kind == 'record' || field.kind == 'geometry' ? 2 : 1}>
									<Select
										label="Field kind"
										data={SURREAL_KINDS}
										value={field.kind}
										clearable
										onChange={(value) => setData(draft => {
											draft.fields[i].kind = value || '';
										})}
									/>
									{field.kind == 'record' && (
										<MultiSelect
											required
											label="Record types"
											data={tableList}
											value={field.kindTables}
											searchable={false}
											onChange={(value) => setData(draft => {
												draft.fields[i].kindTables = value;
											})}
										/>
									)}
									{field.kind === 'geometry' && (
										<MultiSelect
											required
											label="Geometry types"
											data={GEOMETRY_TYPES}
											value={field.kindGeometry}
											searchable={false}
											onChange={(value) => setData(draft => {
												draft.fields[i].kindGeometry = value;
											})}
										/>
									)}
								</SimpleGrid>
								<TextInput
									label="Default field value"
									value={field.value}
									onChange={(e) => setData(draft => {
										draft.fields[i].value = e.currentTarget.value;
									})}
								/>
								<TextInput
									label="Field assertion"
									value={field.assert}
									onChange={(e) => setData(draft => {
										draft.fields[i].assert = e.currentTarget.value;
									})}
								/>
								<PermissionInput
									label="Create access"
									value={field.permissions.create}
									onChange={value => setData(draft => {
										draft.fields[i].permissions.create = value;
									})}
								/>
								<PermissionInput
									label="Select access"
									value={field.permissions.select}
									onChange={value => setData(draft => {
										draft.fields[i].permissions.select = value;
									})}
								/>
								<PermissionInput
									label="Update access"
									value={field.permissions.update}
									onChange={value => setData(draft => {
										draft.fields[i].permissions.update = value;
									})}
								/>
								<PermissionInput
									label="Delete access"
									value={field.permissions.delete}
									onChange={value => setData(draft => {
										draft.fields[i].permissions.delete = value;
									})}
								/>
							</>
						)}
					</Lister>
				</Section>

				<SectionDivider isLight={isLight} />

				<Section
					isLight={isLight}
					title="Indexes"
					description="Define indexes for the table for commonly filtered fields"
				>
					<Lister
						value={data.indexes}
						missing="No schema indexes defined yet"
						name="index"
						onCreate={addIndex}
						onRemove={removeIndex}
					>
						{(index, i) => (
							<>
								<TextInput
									required
									autoFocus
									label="Index name"
									placeholder="index_name"
									value={index.name}
									onChange={(e) => setData(draft => {
										draft.indexes[i].name = e.currentTarget.value;
									})}
								/>
								<TextInput
									label="Indexed fields"
									value={index.fields}
									onChange={(e) => setData(draft => {
										draft.indexes[i].fields = e.currentTarget.value;
									})}
								/>
								<Checkbox
									label="Unique index"
									checked={index.unique}
									onChange={e => setData(draft => {
										draft.indexes[i].unique = e.currentTarget.checked;
									})}
								/>
							</>
						)}
					</Lister>
				</Section>

				<SectionDivider isLight={isLight} />

				<Section
					isLight={isLight}
					title="Events"
					description="Create events to trigger when certain actions are performed on the table"
				>
					<Lister
						value={data.events}
						missing="No schema events defined yet"
						name="event"
						onCreate={addEvent}
						onRemove={removeEvent}
					>
						{(event, i) => (
							<>
								<TextInput
									required
									autoFocus
									label="Event name"
									placeholder="event_name"
									value={event.name}
									onChange={(e) => setData(draft => {
										draft.events[i].name = e.currentTarget.value;
									})}
								/>
								<TextInput
									label="Event condition"
									value={event.cond}
									onChange={(e) => setData(draft => {
										draft.events[i].cond = e.currentTarget.value;
									})}
								/>
								<TextInput
									label="Event result"
									value={event.then}
									onChange={(e) => setData(draft => {
										draft.events[i].then = e.currentTarget.value;
									})}
								/>
							</>
						)}
					</Lister>
				</Section>
			</Stack>

			<Box px="sm" pb="sm">
				{saveBox.render}
			</Box>
		</ScrollArea>
	)
}