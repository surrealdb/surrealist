import { Badge, Box, Checkbox, Collapse, MultiSelect, ScrollArea, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { mdiDotsGrid } from "@mdi/js";
import { ChangeEvent, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { Panel } from "~/components/Panel";
import { GEOMETRY_TYPES, SURREAL_KINDS } from "~/constants";
import { useSaveBox } from "~/hooks/save";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { getActiveSurreal } from "~/surreal";
import { TableDefinition } from "~/typings";
import { showError } from "~/util/helpers";
import { fetchDatabaseSchema } from "~/util/schema";
import { SectionDivider } from "./divider";
import { buildDefinitionQueries, TABLE_TYPES, QUERY_STYLE, isSchemaValid } from "./helpers";
import { PermissionInput } from "./inputs";
import { Lister } from "./lister";
import { Section } from "./section";

export interface SchemaPaneProps {
	table: TableDefinition | null;
}

export function StructurePane(props: SchemaPaneProps) {
	const isLight = useIsLight();
	const [data, setData] = useImmer(props.table!);
	const tableList = useTableNames();
	const [isChanged, setIsChanged] = useState(false);

	const isValid = data ? isSchemaValid(data) : true;

	const saveBox = useSaveBox({
		track: data!,
		valid: !!isValid,
		onSave(original) {
			if (!original?.schema) {
				showError('Save failed', 'Could not determine previous state');
				return;
			}

			const query = buildDefinitionQueries(original, data);
			const surreal = getActiveSurreal();

			surreal.query(query).then(() => {
				fetchDatabaseSchema();
			}).catch(err => {
				showError('Failed to apply schema', err.message);
			});
		},
		onRevert(original) {
			setData(original);
		},
		onChangedState(value) {
			setIsChanged(value);
		}
	});

	useEffect(() => {
		setData(props.table!);
		saveBox.skip();
	}, [props.table]);

	const updateHasView = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const newIsView = e.target.checked;

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
		<Panel
			icon={mdiDotsGrid}
			title="Structure"
			leftSection={
				<>
					{data && (<Badge color={isLight ? 'dark.4' : 'light.0'}>{data.schema.name}</Badge>)}
					{isChanged && (
						isValid ? (
							<Badge color={isLight ? 'blue.6' : 'blue.4'}>Changes not yet applied</Badge>
						) : (
							<Badge color={isLight ? 'red.6' : 'red.4'}>Not all required fields entered</Badge>
						)
					)}
				</>
			}
		>
			{data && (
				<ScrollArea
					style={{ position: 'absolute', inset: 12, top: 0 }}
				>
					<Stack pt="sm" pb={64} px="sm">
						<Section
							isLight={isLight}
							title="General"
							description="The general structural information that defines this table"
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
										draft.schema.drop = e.target.checked;
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
													draft.schema.view!.expr = e.target.value;
												})}
											/>
											<TextInput
												required
												label="View source"
												placeholder="table_name"
												styles={QUERY_STYLE}
												value={data.schema.view?.what}
												onChange={(e) => setData(draft => {
													draft.schema.view!.what = e.target.value;
												})}
											/>
											<TextInput
												label="View condition"
												placeholder="value > 10"
												styles={QUERY_STYLE}
												value={data.schema.view?.cond}
												onChange={(e) => setData(draft => {
													draft.schema.view!.cond = e.target.value;
												})}
											/>
											<TextInput
												label="View grouping"
												placeholder="field_name"
												styles={QUERY_STYLE}
												value={data.schema.view?.group}
												onChange={(e) => setData(draft => {
													draft.schema.view!.group = e.target.value;
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
							description="Control read and write access rules for this table"
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
							description="Define the fields that make up records within this table"
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
												draft.fields[i].name = e.target.value;
											})}
										/>
										<Checkbox
											label="Is field flexible"
											checked={field.flexible}
											onChange={e => setData(draft => {
												draft.fields[i].flexible = e.target.checked;
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
											label="Field value"
											value={field.value}
											onChange={(e) => setData(draft => {
												draft.fields[i].value = e.target.value;
											})}
										/>
										<TextInput
											label="Field assertion"
											value={field.assert}
											onChange={(e) => setData(draft => {
												draft.fields[i].assert = e.target.value;
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
							description="Define fields to index for faster lookups and unique constraints"
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
												draft.indexes[i].name = e.target.value;
											})}
										/>
										<TextInput
											label="Indexed fields"
											value={index.fields}
											onChange={(e) => setData(draft => {
												draft.indexes[i].fields = e.target.value;
											})}
										/>
										<Checkbox
											label="Unique index"
											checked={index.unique}
											onChange={e => setData(draft => {
												draft.indexes[i].unique = e.target.checked;
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
							description="Define side effects to run when a record in this table is modified"
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
												draft.events[i].name = e.target.value;
											})}
										/>
										<TextInput
											label="Event condition"
											value={event.cond}
											onChange={(e) => setData(draft => {
												draft.events[i].cond = e.target.value;
											})}
										/>
										<TextInput
											label="Event result"
											value={event.then}
											onChange={(e) => setData(draft => {
												draft.events[i].then = e.target.value;
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
			)}
		</Panel>
	)
}