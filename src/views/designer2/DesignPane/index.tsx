import { Accordion, ActionIcon, Box, Checkbox, Collapse, MultiSelect, ScrollArea, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { mdiClose, mdiWrench } from "@mdi/js";
import { ChangeEvent, useEffect } from "react";
import { useImmer } from "use-immer";
import { Panel } from "~/components/Panel";
import { GEOMETRY_TYPES, SURREAL_KINDS } from "~/constants";
import { useSaveBox } from "~/hooks/save";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { TableDefinition } from "~/types";
import { showError } from "~/util/helpers";
import { fetchDatabaseSchema } from "~/util/schema";
import { buildDefinitionQueries, TABLE_TYPES, isSchemaValid } from "./helpers";
import { PermissionInput, QueryInput } from "./inputs";
import { Lister } from "./lister";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";

export interface SchemaPaneProps {
	table: TableDefinition | null;
	onClose: () => void;
}

function SectionTitle({ children }: { children: string }) {
	return (
		<Accordion.Control py="xs">
			<Text weight={700} size="lg">
				{children}
			</Text>
		</Accordion.Control>
	);
}

export function DesignPane(props: SchemaPaneProps) {
	const [data, setData] = useImmer(props.table!);
	const tableList = useTableNames();

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
			const surreal = adapter.getActiveSurreal();

			surreal.query(query).then(() => {
				fetchDatabaseSchema();
			}).catch(err => {
				showError('Failed to apply schema', err.message);
			});
		},
		onRevert(original) {
			setData(original);
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
			});
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
			});
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
			});
		});
	});

	const removeEvent = useStable((index: number) => {
		setData(d => {
			d.events.splice(index, 1);
		});
	});

	return (
		<Panel
			icon={mdiWrench}
			title="Design"
			// leftSection={
			// 	<>
			// 		{data && (<Badge color={isLight ? 'dark.4' : 'light.0'}>{data.schema.name}</Badge>)}
			// 		{isChanged && (
			// 			isValid ? (
			// 				<Badge color={isLight ? 'blue.6' : 'blue.4'}>Changes not yet applied</Badge>
			// 			) : (
			// 				<Badge color={isLight ? 'red.6' : 'red.4'}>Not all required fields entered</Badge>
			// 			)
			// 		)}
			// 	</>
			// }
			rightSection={
				<ActionIcon
					title="Refresh"
					onClick={props.onClose}
				>
					<Icon color="light.4" path={mdiClose} />
				</ActionIcon>
			}
		>
			{data && (
				<>
					<ScrollArea
						style={{ position: 'absolute', inset: 12, top: 0, bottom: 68 }}
					>
						<Accordion
							multiple
							defaultValue={['general']}
							chevronPosition="left"
						>
							<Accordion.Item value="general">
								<SectionTitle>
									General
								</SectionTitle>
								<Accordion.Panel>
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
													<QueryInput
														required
														label="View projections"
														placeholder="*"
														value={data.schema.view?.expr}
														onChangeText={value => setData(draft => {
															draft.schema.view!.expr = value;
														})}
													/>
													<QueryInput
														required
														label="View source"
														placeholder="table_name"
														value={data.schema.view?.what}
														onChangeText={value => setData(draft => {
															draft.schema.view!.what = value;
														})}
													/>
													<QueryInput
														label="View condition"
														placeholder="value > 10"
														value={data.schema.view?.cond}
														onChangeText={value => setData(draft => {
															draft.schema.view!.cond = value;
														})}
													/>
													<QueryInput
														label="View grouping"
														placeholder="field_name"
														value={data.schema.view?.group}
														onChangeText={value => setData(draft => {
															draft.schema.view!.group = value;
														})}
													/>
												</Stack>
											</Collapse>
										</div>
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="permissions">
								<SectionTitle>
									Permissions
								</SectionTitle>
								<Accordion.Panel>
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
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="fields">
								<SectionTitle>
									Fields
								</SectionTitle>
								<Accordion.Panel>
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
												<QueryInput
													label="Field value"
													value={field.value}
													onChangeText={value => setData(draft => {
														draft.fields[i].value = value;
													})}
												/>
												<QueryInput
													label="Field assertion"
													value={field.assert}
													onChangeText={value => setData(draft => {
														draft.fields[i].assert = value;
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
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="indexes">
								<SectionTitle>
									Indexes
								</SectionTitle>
								<Accordion.Panel>
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
												<QueryInput
													label="Indexed fields"
													value={index.fields}
													onChangeText={value => setData(draft => {
														draft.indexes[i].fields = value;
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
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="events">
								<SectionTitle>
									Events
								</SectionTitle>
								<Accordion.Panel>
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
												<QueryInput
													label="Event condition"
													value={event.cond}
													onChangeText={value => setData(draft => {
														draft.events[i].cond = value;
													})}
												/>
												<QueryInput
													label="Event result"
													value={event.then}
													onChangeText={value => setData(draft => {
														draft.events[i].then = value;
													})}
												/>
											</>
										)}
									</Lister>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					</ScrollArea>

					<Box
						px="sm"
						pb="sm"
						pos="absolute"
						left={4}
						bottom={4}
						right={4}
					>
						{saveBox.render}
					</Box>
				</>
			)}
		</Panel>
	);
}