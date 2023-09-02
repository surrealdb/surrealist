import { Accordion, TextInput, Checkbox, SimpleGrid, Select, MultiSelect } from "@mantine/core";
import { SURREAL_KINDS, GEOMETRY_TYPES } from "~/constants";
import { ElementProps, SectionTitle } from "../helpers";
import { QueryInput, PermissionInput } from "../inputs";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";
import { useTableNames } from "~/hooks/schema";

export function FieldsElement({ data, setData }: ElementProps) {
	const tableList = useTableNames();

	const addField = useStable(() => {
		setData((d) => {
			d.fields.push({
				name: "",
				assert: "",
				flexible: false,
				kind: "",
				value: "",
				kindTables: [],
				kindGeometry: [],
				permissions: {
					create: "FULL",
					select: "FULL",
					update: "FULL",
					delete: "FULL",
				},
			});
		});
	});

	const removeField = useStable((index: number) => {
		setData((d) => {
			d.fields.splice(index, 1);
		});
	});
	
	return (
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
								onChange={(e) =>
									setData((draft) => {
										draft.fields[i].name = e.target.value;
									})
								}
							/>
							<Checkbox
								label="Is field flexible"
								checked={field.flexible}
								onChange={(e) =>
									setData((draft) => {
										draft.fields[i].flexible = e.target.checked;
									})
								}
							/>
							<SimpleGrid cols={field.kind == "record" || field.kind == "geometry" ? 2 : 1}>
								<Select
									label="Field kind"
									data={SURREAL_KINDS}
									value={field.kind}
									clearable
									onChange={(value) =>
										setData((draft) => {
											draft.fields[i].kind = value || "";
										})
									}
								/>
								{field.kind == "record" && (
									<MultiSelect
										required
										label="Record types"
										data={tableList}
										value={field.kindTables}
										searchable={false}
										onChange={(value) =>
											setData((draft) => {
												draft.fields[i].kindTables = value;
											})
										}
									/>
								)}
								{field.kind === "geometry" && (
									<MultiSelect
										required
										label="Geometry types"
										data={GEOMETRY_TYPES}
										value={field.kindGeometry}
										searchable={false}
										onChange={(value) =>
											setData((draft) => {
												draft.fields[i].kindGeometry = value;
											})
										}
									/>
								)}
							</SimpleGrid>
							<QueryInput
								label="Field value"
								value={field.value}
								onChangeText={(value) =>
									setData((draft) => {
										draft.fields[i].value = value;
									})
								}
							/>
							<QueryInput
								label="Field assertion"
								value={field.assert}
								onChangeText={(value) =>
									setData((draft) => {
										draft.fields[i].assert = value;
									})
								}
							/>
							<PermissionInput
								label="Create access"
								value={field.permissions.create}
								onChange={(value) =>
									setData((draft) => {
										draft.fields[i].permissions.create = value;
									})
								}
							/>
							<PermissionInput
								label="Select access"
								value={field.permissions.select}
								onChange={(value) =>
									setData((draft) => {
										draft.fields[i].permissions.select = value;
									})
								}
							/>
							<PermissionInput
								label="Update access"
								value={field.permissions.update}
								onChange={(value) =>
									setData((draft) => {
										draft.fields[i].permissions.update = value;
									})
								}
							/>
							<PermissionInput
								label="Delete access"
								value={field.permissions.delete}
								onChange={(value) =>
									setData((draft) => {
										draft.fields[i].permissions.delete = value;
									})
								}
							/>
						</>
					)}
				</Lister>
			</Accordion.Panel>
		</Accordion.Item>
	);
}