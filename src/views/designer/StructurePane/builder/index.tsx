import { Checkbox, Collapse, ScrollArea, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { ChangeEvent, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useSaveBox } from "~/hooks/save";
import { useIsLight } from "~/hooks/theme";
import { TableDefinition } from "~/typings";
import { SectionDivider } from "./divider";
import { Section } from "./section";
import { buildDefinitionQueries } from "./helpers";
import { showError } from "~/util/helpers";
import { getActiveSurreal } from "~/surreal";
import { fetchDatabaseSchema } from "~/util/schema";
import { useStable } from "~/hooks/stable";

const TABLE_TYPES = [
	{ label: 'Schemaless', value: 'schemaless' },
	{ label: 'Schemafull', value: 'schemafull' }
];

export interface BuilderTabProps {
	table: TableDefinition;
}

export function BuilderTab(props: BuilderTabProps) {
	const isLight = useIsLight();
	const [data, setData] = useImmer(props.table!);
	const [isView, setIsView] = useState(false);

	const saveBox = useSaveBox({
		track: data!,
		onSave(original) {
			if (!original?.schema) {
				showError('Save failed', 'Could not determine previous state');
				return;
			}

			const query = buildDefinitionQueries(original, data);
			const surreal = getActiveSurreal();

			surreal.query(query).then(() => {
				fetchDatabaseSchema();
			});
		},
		onRevert(original) {
			setData(original);
			setIsView(!!original.schema.view)
		},
	});

	useEffect(() => {
		setData(props.table!);
		setIsView(!!props.table!.schema.view)
		saveBox.skip();
	}, [props.table]);

	const updateHasView = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const newIsView = e.currentTarget.checked;

		setIsView(newIsView);

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
				delete draft.schema.view;
			});
		}
	});

	/*
	permissions: Permissions;
	*/

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
								checked={isView}
								onChange={updateHasView}
							/>
							<Collapse
								in={isView}
							>
								<Stack pt="md">
									<TextInput
										required
										label="View projections"
										placeholder="*"
										value={data.schema.view?.expr}
										onChange={(e) => setData(draft => {
											draft.schema.view!.expr = e.currentTarget.value;
										})}
									/>
									<TextInput
										required
										label="View source"
										placeholder="table_name"
										value={data.schema.view?.what}
										onChange={(e) => setData(draft => {
											draft.schema.view!.what = e.currentTarget.value;
										})}
									/>
									<TextInput
										label="View condition"
										placeholder="value > 10"
										value={data.schema.view?.cond}
										onChange={(e) => setData(draft => {
											draft.schema.view!.cond = e.currentTarget.value;
										})}
									/>
									<TextInput
										label="View grouping"
										placeholder="field_name"
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
						<TextInput label="Table Name" />
						<Select label="Table Type" data={TABLE_TYPES} />
						<Checkbox label="Drop writes to this table" />
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